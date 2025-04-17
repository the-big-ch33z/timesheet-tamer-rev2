import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { 
  TimeEntryEvent, 
  TimeEntryEventType, 
  TimeEntryServiceConfig, 
  EntryCache 
} from "./types";
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate, isValidDate } from '../validation/dateValidation';
import { EventManager } from "./event-handling";
import { 
  createEmptyCache,
  isCacheValid, 
  invalidateCache, 
  updateCacheEntries,
  getCachedUserEntries,
  getCachedDayEntries,
  getCachedMonthEntries
} from "./cache-management";
import {
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  loadEntriesFromStorage,
  saveEntriesToStorage,
  loadDeletedEntries,
  addToDeletedEntries
} from "./storage-operations";
import { validateEntry, autoCalculateHours, calculateTotalHours } from "./entry-validation";
import { filterEntriesByUser, filterEntriesByDay, filterEntriesByMonth } from "./query-operations";

const logger = createTimeLogger('UnifiedTimeEntryService');

/**
 * Enhanced, unified time entry service with reactivity and caching
 */
export class UnifiedTimeEntryService {
  private eventManager: EventManager;
  private cache: EntryCache;
  private config: Required<TimeEntryServiceConfig>;
  private isInitialized = false;
  private deletedEntryIds: string[] = [];
  private storageCleanupFn: (() => void) | null = null;

  constructor(config?: TimeEntryServiceConfig) {
    this.config = {
      enableCaching: true,
      cacheTTL: 60000, // 1 minute default
      validateOnAccess: true,
      enableAuditing: true,
      storageKey: STORAGE_KEY,
      ...config
    };

    this.eventManager = new EventManager();
    
    this.cache = createEmptyCache();

    if (typeof window !== 'undefined') {
      this.storageCleanupFn = this.eventManager.setupStorageListener(
        this.config.storageKey,
        () => this.invalidateCache(),
        () => this.loadDeletedEntries(),
        DELETED_ENTRIES_KEY
      );
    }

    this.loadDeletedEntries();
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
    this.invalidateCache();
    this.isInitialized = false;
    logger.debug('Service destroyed');
  }

  public addEventListener(type: TimeEntryEventType, listener: (event: TimeEntryEvent) => void): () => void {
    return this.eventManager.addEventListener(type, listener);
  }

  private invalidateCache(): void {
    this.cache = invalidateCache(this.cache);
  }

  private isCacheValid(): boolean {
    return isCacheValid(this.cache, this.config.enableCaching, this.config.cacheTTL);
  }

  public getDeletedEntryIds(): string[] {
    return [...this.deletedEntryIds];
  }

  private loadDeletedEntries(): void {
    this.deletedEntryIds = loadDeletedEntries(DELETED_ENTRIES_KEY);
  }

  public getAllEntries(): TimeEntry[] {
    try {
      if (this.isCacheValid()) {
        logger.debug('Using cached entries');
        return [...this.cache.entries];
      }

      const entries = loadEntriesFromStorage(this.config.storageKey, this.deletedEntryIds);
      
      this.cache = updateCacheEntries(this.cache, entries);
      
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
    
    const allEntries = this.getAllEntries();
    
    return getCachedUserEntries(this.cache, userId, allEntries);
  }

  public getDayEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getDayEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getDayEntries');
      return [];
    }
    
    const userEntries = this.getUserEntries(userId);
    
    return getCachedDayEntries(this.cache, date, userId, userEntries);
  }

  public getMonthEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getMonthEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getMonthEntries');
      return [];
    }
    
    const userEntries = this.getUserEntries(userId);
    
    return getCachedMonthEntries(this.cache, date, userId, userEntries);
  }

  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    const validation = validateEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error: validation.message, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
    
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      const error = 'Invalid date in entry data';
      logger.error(error, entryData);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
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
      
      const saved = saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (saved) {
        this.invalidateCache();
        
        this.eventManager.dispatchEvent({
          type: 'entry-created',
          timestamp: new Date(),
          payload: { entry: newEntry },
          userId: newEntry.userId
        });
        
        logger.debug(`Created new entry with ID ${newId}`, newEntry);
        return newId;
      }
      
      const error = 'Failed to save new entry';
      logger.error(error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    } catch (error) {
      logger.error('Error creating entry', error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
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
      
      const updatedEntry = {
        ...originalEntry,
        ...updates
      };
      
      allEntries[entryIndex] = updatedEntry;
      
      const saved = saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (saved) {
        this.invalidateCache();
        
        this.eventManager.dispatchEvent({
          type: 'entry-updated',
          timestamp: new Date(),
          payload: { 
            entryId,
            updates,
            original: originalEntry,
            updated: updatedEntry
          },
          userId: updatedEntry.userId
        });
        
        logger.debug(`Updated entry ${entryId}`, updates);
        return true;
      }
      
      logger.error(`Failed to save update for entry ${entryId}`);
      return false;
    } catch (error) {
      logger.error(`Error updating entry ${entryId}`, error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'updateEntry', entryId, updates }
      });
      
      return false;
    }
  }

  public deleteEntry(entryId: string): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for deletion');
      return false;
    }
    
    try {
      const allEntries = this.getAllEntries();
      
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      const deletedEntry = allEntries[entryIndex];
      
      this.deleteEntryFromStorage(entryId);
      
      allEntries.splice(entryIndex, 1);
      
      this.saveEntriesToStorage(allEntries)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            
            this.eventManager.dispatchEvent({
              type: 'entry-deleted',
              timestamp: new Date(),
              payload: { entryId, entry: deletedEntry },
              userId: deletedEntry.userId
            });
            
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
                detail: { entryId }
              }));
            }
            
            logger.debug(`Deleted entry ${entryId}`);
          } else {
            logger.error(`Failed to save after deleting entry ${entryId}`);
          }
        })
        .catch(error => {
          logger.error(`Error saving after deleting entry ${entryId}:`, error);
        });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}`, error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'deleteEntry', entryId }
      });
      
      return false;
    }
  }

  public calculateTotalHours(entries: TimeEntry[]): number {
    return calculateTotalHours(entries);
  }

  public autoCalculateHours(startTime: string, endTime: string): number {
    return autoCalculateHours(startTime, endTime);
  }

  public validateEntry(entry: Partial<TimeEntry>) {
    return validateEntry(entry);
  }

  public async saveEntriesToStorage(entriesToSave: TimeEntry[]): Promise<boolean> {
    try {
      const result = await saveEntriesToStorage(entriesToSave, this.config.storageKey, this.deletedEntryIds);
      
      if (result) {
        this.invalidateCache();
      }
      
      return result;
    } catch (error) {
      logger.error("Error in saveEntriesToStorage:", error);
      return false;
    }
  }

  public deleteEntryFromStorage(entryId: string): boolean {
    logger.debug("Direct deletion of entry:", entryId);
    
    try {
      addToDeletedEntries(entryId, this.deletedEntryIds, DELETED_ENTRIES_KEY)
        .then(updatedIds => {
          this.deletedEntryIds = updatedIds;
          
          this.invalidateCache();
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
              detail: { entryId }
            }));
          }
        })
        .catch(error => {
          logger.error("Error updating deleted entries:", error);
        });
      
      return true;
    } catch (error) {
      logger.error("Error deleting entry from storage:", error);
      return false;
    }
  }

  public cleanupDeletedEntries(maxAgeDays: number = 30): void {
    logger.debug(`Cleanup requested for entries older than ${maxAgeDays} days`);
  }
}
