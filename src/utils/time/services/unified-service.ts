import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate, isValidDate } from '../validation/dateValidation';
import { EventManager, TimeEntryEvent, TimeEntryEventType } from './event-manager';
import { CacheManager } from './cache-manager';
import { 
  loadEntriesFromStorage,
  saveEntriesToStorage,
  loadDeletedEntries,
  addToDeletedEntries,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from './storage-operations';
import { 
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours,
  ValidationResult
} from './entry-validation';

const logger = createTimeLogger('UnifiedTimeEntryService');

export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

/**
 * Unified Time Entry Service - Refactored to use modular components
 */
export class UnifiedTimeEntryService {
  private eventManager: EventManager;
  private cacheManager: CacheManager;
  private config: Required<TimeEntryServiceConfig>;
  private isInitialized = false;
  private deletedEntryIds: string[] = [];
  private storageCleanupFn: (() => void) | null = null;

  constructor(config?: TimeEntryServiceConfig) {
    this.config = {
      enableCaching: true,
      cacheTTL: 60000,
      validateOnAccess: true,
      enableAuditing: true,
      storageKey: STORAGE_KEY,
      ...config
    };

    this.eventManager = new EventManager();
    this.cacheManager = new CacheManager({
      enableCaching: this.config.enableCaching,
      cacheTTL: this.config.cacheTTL
    });

    if (typeof window !== 'undefined') {
      this.storageCleanupFn = this.eventManager.setupStorageListener(
        this.config.storageKey,
        () => this.cacheManager.invalidate(),
        () => this.loadDeletedEntries(),
        DELETED_ENTRIES_KEY
      );
    }

    this.loadDeletedEntries();
    
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init(): void {
    if (this.isInitialized) return;
    
    this.getAllEntries();
    this.isInitialized = true;
    logger.debug('Service initialized');
  }

  public destroy(): void {
    if (this.storageCleanupFn) {
      this.storageCleanupFn();
      this.storageCleanupFn = null;
    }
    
    this.eventManager.clear();
    this.cacheManager.invalidate();
    this.isInitialized = false;
    logger.debug('Service destroyed');
  }

  public addEventListener(type: TimeEntryEventType, listener: (event: TimeEntryEvent) => void): () => void {
    return this.eventManager.addEventListener(type, listener);
  }

  private loadDeletedEntries(): void {
    this.deletedEntryIds = loadDeletedEntries(DELETED_ENTRIES_KEY);
  }

  public getDeletedEntryIds(): string[] {
    return [...this.deletedEntryIds];
  }

  public getAllEntries(): TimeEntry[] {
    try {
      const cachedEntries = this.cacheManager.getEntries();
      if (cachedEntries.length > 0) {
        return cachedEntries;
      }

      const entries = loadEntriesFromStorage(this.config.storageKey, this.deletedEntryIds);
      this.cacheManager.updateEntries(entries);
      
      this.eventManager.dispatchEvent({
        type: 'entries-loaded',
        timestamp: new Date(),
        payload: { count: entries.length }
      });
      
      return [...entries];
    } catch (error) {
      logger.error('Error loading entries from storage', error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'getAllEntries' }
      });
      
      return [];
    }
  }

  public getUserEntries(userId: string): TimeEntry[] {
    if (!userId) {
      logger.warn('No userId provided to getUserEntries');
      return [];
    }
    
    const cachedEntries = this.cacheManager.getUserEntries(userId);
    if (cachedEntries) {
      return cachedEntries;
    }
    
    const userEntries = this.getAllEntries().filter(entry => entry.userId === userId);
    this.cacheManager.setUserEntries(userId, userEntries);
    
    return [...userEntries];
  }

  public getDayEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date) || !userId) {
      logger.warn('Invalid date or userId provided to getDayEntries');
      return [];
    }
    
    const cacheKey = `${userId}-${date.toDateString()}`;
    const cachedEntries = this.cacheManager.getDayEntries(cacheKey);
    if (cachedEntries) {
      return cachedEntries;
    }
    
    const userEntries = this.getUserEntries(userId);
    const dayEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    this.cacheManager.setDayEntries(cacheKey, dayEntries);
    return [...dayEntries];
  }

  public getMonthEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date) || !userId) {
      logger.warn('Invalid date or userId provided to getMonthEntries');
      return [];
    }
    
    const cacheKey = `${userId}-${date.getFullYear()}-${date.getMonth()}`;
    const cachedEntries = this.cacheManager.getMonthEntries(cacheKey);
    if (cachedEntries) {
      return cachedEntries;
    }
    
    const userEntries = this.getUserEntries(userId);
    const monthEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return (
        entryDate.getMonth() === date.getMonth() && 
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    
    this.cacheManager.setMonthEntries(cacheKey, monthEntries);
    return [...monthEntries];
  }

  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    const validation = validateTimeEntry(entryData);
    if (!validation.valid) {
      this.dispatchErrorEvent(validation.message, 'createEntry', entryData);
      return null;
    }
    
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      const error = 'Invalid date in entry data';
      this.dispatchErrorEvent(error, 'createEntry', entryData);
      return null;
    }
    
    try {
      const newId = uuidv4();
      const newEntry: TimeEntry = {
        ...entryData,
        id: newId,
        date: entryDate
      };
      
      const allEntries = this.getAllEntries();
      allEntries.push(newEntry);
      
      saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.cacheManager.invalidate();
            this.dispatchEntryEvent('entry-created', { entry: newEntry }, newEntry.userId);
          } else {
            this.dispatchErrorEvent('Failed to save new entry', 'createEntry', entryData);
          }
        })
        .catch(error => {
          this.dispatchErrorEvent(error, 'createEntry', entryData);
        });
      
      return newId;
    } catch (error) {
      this.dispatchErrorEvent(error, 'createEntry', entryData);
      return null;
    }
  }

  public updateEntry(entryId: string, updates: Partial<TimeEntry>): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for update');
      return false;
    }
    
    try {
      if (updates.date) {
        const validDate = ensureDate(updates.date);
        if (!validDate) {
          logger.error('Invalid date in update data', updates);
          return false;
        }
        updates.date = validDate;
      }
      
      const allEntries = this.getAllEntries();
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.error(`Entry with ID ${entryId} not found for update`);
        return false;
      }
      
      const originalEntry = allEntries[entryIndex];
      const updatedEntry = { ...originalEntry, ...updates };
      
      allEntries[entryIndex] = updatedEntry;
      
      saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.cacheManager.invalidate();
            this.dispatchEntryEvent('entry-updated', {
              entryId,
              updates,
              original: originalEntry,
              updated: updatedEntry
            }, updatedEntry.userId);
          } else {
            logger.error(`Failed to save update for entry ${entryId}`);
          }
        })
        .catch(error => {
          this.dispatchErrorEvent(error, 'updateEntry', { entryId, updates });
        });
      
      return true;
    } catch (error) {
      this.dispatchErrorEvent(error, 'updateEntry', { entryId, updates });
      return false;
    }
  }

  public async deleteEntry(entryId: string): Promise<boolean> {
    if (!entryId) {
      logger.error('No entry ID provided for deletion');
      return false;
    }
    
    try {
      const allEntries = this.getAllEntries();
      const entryToDelete = allEntries.find(entry => entry.id === entryId);
      
      if (!entryToDelete) {
        logger.error(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      const updatedEntries = allEntries.filter(entry => entry.id !== entryId);
      const updatedDeletedIds = await addToDeletedEntries(entryId, this.deletedEntryIds, DELETED_ENTRIES_KEY);
      
      this.deletedEntryIds = updatedDeletedIds;
      
      const savedEntries = await saveEntriesToStorage(updatedEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (savedEntries) {
        this.cacheManager.invalidate();
        
        // Create standardized event data matching delete-operations format
        const now = new Date();
        const standardEventData = {
          entryId,
          userId: entryToDelete.userId,
          timestamp: Date.now(),
          date: now.toISOString().slice(0, 10),
          monthYear: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          requiresRefresh: true,
          source: 'unified-service'
        };
        
        this.dispatchEntryEvent('entry-deleted', standardEventData, entryToDelete.userId);
        
        return true;
      } else {
        logger.error(`Failed to save entries after deletion of ${entryId}`);
        return false;
      }
    } catch (error) {
      this.dispatchErrorEvent(error, 'deleteEntry', { entryId });
      return false;
    }
  }

  public async saveEntriesToStorage(entriesToSave: TimeEntry[]): Promise<boolean> {
    try {
      const result = await saveEntriesToStorage(entriesToSave, this.config.storageKey, this.deletedEntryIds);
      
      if (result) {
        this.cacheManager.invalidate();
      }
      
      return result;
    } catch (error) {
      logger.error("Error in saveEntriesToStorage:", error);
      return false;
    }
  }

  public async deleteEntryFromStorage(entryId: string): Promise<boolean> {
    logger.debug("Direct deletion of entry from storage:", entryId);
    
    try {
      const updatedIds = await addToDeletedEntries(entryId, this.deletedEntryIds, DELETED_ENTRIES_KEY);
      this.deletedEntryIds = updatedIds;
      
      this.cacheManager.invalidate();
      
      return true;
    } catch (error) {
      logger.error("Error deleting entry from storage:", error);
      return false;
    }
  }

  public calculateTotalHours(entries: TimeEntry[]): number {
    return calculateTotalHours(entries);
  }

  public autoCalculateHours(startTime: string, endTime: string): number {
    return autoCalculateHours(startTime, endTime);
  }

  public validateEntry(entry: Partial<TimeEntry>): ValidationResult {
    return validateTimeEntry(entry);
  }
  
  public cleanupDeletedEntries(maxAgeDays: number = 30): void {
    logger.debug(`Cleanup requested for entries older than ${maxAgeDays} days`);
  }

  private dispatchEntryEvent(type: TimeEntryEventType, payload: any, userId?: string): void {
    this.eventManager.dispatchEvent({
      type,
      timestamp: new Date(),
      payload,
      userId
    });
  }

  private dispatchErrorEvent(error: any, context: string, details?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`Error in ${context}:`, error);
    
    this.eventManager.dispatchEvent({
      type: 'error',
      timestamp: new Date(),
      payload: {
        error: errorMessage,
        context,
        details
      }
    });
  }
}

// Export utility functions
export {
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
};

// Export types
export type { 
  TimeEntryEventType,
  TimeEntryEvent,
  ValidationResult
};
