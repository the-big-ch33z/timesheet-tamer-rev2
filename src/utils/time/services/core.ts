
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
  addToDeletedEntries as addToDeletedEntriesList
} from "./storage-operations";
import { validateEntry, autoCalculateHours, calculateTotalHours } from "./entry-validation";

// Re-export key constants and types for backward compatibility
export { STORAGE_KEY, DELETED_ENTRIES_KEY } from './storage-operations';
export { storageWriteLock } from './storage-operations';
export type { TimeEntryEvent, TimeEntryEventType } from './types';

// Create a dedicated logger for this service
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
    // Default configuration
    this.config = {
      enableCaching: true,
      cacheTTL: 60000, // 1 minute default
      validateOnAccess: true,
      enableAuditing: true,
      storageKey: STORAGE_KEY,
      ...config
    };

    // Initialize event manager
    this.eventManager = new EventManager();
    
    // Initialize cache
    this.cache = createEmptyCache();

    // Setup storage event listener for cross-tab synchronization
    if (typeof window !== 'undefined') {
      this.storageCleanupFn = this.eventManager.setupStorageListener(
        this.config.storageKey,
        () => this.invalidateCache(),
        () => this.loadDeletedEntries(),
        DELETED_ENTRIES_KEY
      );
    }

    // Load deleted entries
    this.loadDeletedEntries();
  }

  /**
   * Initialize the service
   */
  public init(): void {
    if (this.isInitialized) return;
    
    // Pre-load data to warm up cache
    this.getAllEntries();
    this.isInitialized = true;
    logger.debug('Service initialized');
  }

  /**
   * Clean up resources when service is no longer needed
   */
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

  /**
   * Add event listener
   */
  public addEventListener(type: TimeEntryEventType, listener: (event: TimeEntryEvent) => void): () => void {
    return this.eventManager.addEventListener(type, listener);
  }

  /**
   * Invalidate the cache
   */
  private invalidateCache(): void {
    this.cache = invalidateCache(this.cache);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return isCacheValid(this.cache, this.config.enableCaching, this.config.cacheTTL);
  }

  /**
   * Get the list of deleted entry IDs
   */
  public getDeletedEntryIds(): string[] {
    return [...this.deletedEntryIds];
  }

  /**
   * Load deleted entries from storage
   */
  private loadDeletedEntries(): void {
    this.deletedEntryIds = loadDeletedEntries(DELETED_ENTRIES_KEY);
  }

  /**
   * Get all entries from storage
   */
  public getAllEntries(): TimeEntry[] {
    try {
      // Check cache first if enabled
      if (this.isCacheValid()) {
        logger.debug('Using cached entries');
        return [...this.cache.entries];
      }

      // Load entries from storage
      const entries = loadEntriesFromStorage(this.config.storageKey, this.deletedEntryIds);
      
      // Update cache
      this.cache = updateCacheEntries(this.cache, entries);
      
      // Dispatch event
      this.eventManager.dispatchEvent({
        type: 'entries-loaded',
        timestamp: new Date(),
        payload: { count: entries.length }
      });
      
      return [...entries];
    } catch (error) {
      logger.error('Error loading entries from storage', error);
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'getAllEntries' }
      });
      
      return [];
    }
  }

  /**
   * Get entries for a specific user
   */
  public getUserEntries(userId: string): TimeEntry[] {
    if (!userId) {
      logger.warn('No userId provided to getUserEntries');
      return [];
    }
    
    // Get all entries (may use cache)
    const allEntries = this.getAllEntries();
    
    // Get cached user entries or filter and cache
    return getCachedUserEntries(this.cache, userId, allEntries);
  }

  /**
   * Get entries for a specific day and user
   */
  public getDayEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getDayEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getDayEntries');
      return [];
    }
    
    // Get user entries first (may use cache)
    const userEntries = this.getUserEntries(userId);
    
    // Get cached day entries or filter and cache
    return getCachedDayEntries(this.cache, date, userId, userEntries);
  }

  /**
   * Get entries for a specific month and user
   */
  public getMonthEntries(date: Date, userId: string): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getMonthEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getMonthEntries');
      return [];
    }
    
    // Get user entries first (may use cache)
    const userEntries = this.getUserEntries(userId);
    
    // Get cached month entries or filter and cache
    return getCachedMonthEntries(this.cache, date, userId, userEntries);
  }

  /**
   * Create a new entry
   */
  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    // Validate entry data
    const validation = validateEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error: validation.message, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
    
    // Ensure we have a valid date
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      const error = 'Invalid date in entry data';
      logger.error(error, entryData);
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
    
    try {
      // Create the entry with a new ID
      const newId = uuidv4();
      const newEntry: TimeEntry = {
        ...entryData,
        id: newId,
        date: entryDate
      };
      
      // Get all entries and add the new one
      const allEntries = this.getAllEntries();
      allEntries.push(newEntry);
      
      // Save back to storage
      const saved = saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
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
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    } catch (error) {
      logger.error('Error creating entry', error);
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
  }

  /**
   * Update an existing entry
   */
  public updateEntry(entryId: string, updates: Partial<TimeEntry>): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for update');
      return false;
    }
    
    try {
      // Handle date update if present
      if (updates.date) {
        const validDate = ensureDate(updates.date);
        if (!validDate) {
          logger.error('Invalid date in update data', updates);
          return false;
        }
        updates.date = validDate;
      }
      
      // Get all entries
      const allEntries = this.getAllEntries();
      
      // Find the entry to update
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.error(`Entry with ID ${entryId} not found for update`);
        return false;
      }
      
      const originalEntry = allEntries[entryIndex];
      
      // Update the entry
      const updatedEntry = {
        ...originalEntry,
        ...updates
      };
      
      allEntries[entryIndex] = updatedEntry;
      
      // Save back to storage
      const saved = saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
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
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'updateEntry', entryId, updates }
      });
      
      return false;
    }
  }

  /**
   * Delete an entry
   */
  public deleteEntry(entryId: string): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for deletion');
      return false;
    }
    
    try {
      // Get all entries
      const allEntries = this.getAllEntries();
      
      // Find the entry to delete
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      const deletedEntry = allEntries[entryIndex];
      
      // Add to deleted entries list
      this.deleteEntryFromStorage(entryId);
      
      // Remove the entry
      allEntries.splice(entryIndex, 1);
      
      // Save back to storage
      const saved = saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
        this.eventManager.dispatchEvent({
          type: 'entry-deleted',
          timestamp: new Date(),
          payload: { entryId, entry: deletedEntry },
          userId: deletedEntry.userId
        });
        
        logger.debug(`Deleted entry ${entryId}`);
        
        // Dispatch custom event for compatibility with existing code
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
            detail: { entryId }
          }));
        }
        
        return true;
      }
      
      logger.error(`Failed to save after deleting entry ${entryId}`);
      return false;
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}`, error);
      
      // Dispatch error event
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'deleteEntry', entryId }
      });
      
      return false;
    }
  }

  /**
   * Calculate total hours from a list of entries
   */
  public calculateTotalHours(entries: TimeEntry[]): number {
    return calculateTotalHours(entries);
  }

  /**
   * Auto-calculate hours from start and end times
   */
  public autoCalculateHours(startTime: string, endTime: string): number {
    return autoCalculateHours(startTime, endTime);
  }

  /**
   * Validate entry data
   */
  public validateEntry(entry: Partial<TimeEntry>) {
    return validateEntry(entry);
  }

  /**
   * Save entries to storage with conflict resolution
   */
  public saveEntriesToStorage(entriesToSave: TimeEntry[]): boolean {
    const result = saveEntriesToStorage(entriesToSave, this.config.storageKey, this.deletedEntryIds);
    
    if (result) {
      // Invalidate cache on successful save
      this.invalidateCache();
    }
    
    return result;
  }

  /**
   * Direct deletion of an entry from storage
   */
  public deleteEntryFromStorage(entryId: string): boolean {
    logger.debug("Direct deletion of entry:", entryId);
    
    try {
      // Add to deleted entries list
      this.deletedEntryIds = addToDeletedEntriesList(
        entryId, 
        this.deletedEntryIds,
        DELETED_ENTRIES_KEY
      );
      
      // Invalidate cache
      this.invalidateCache();
      
      // Dispatch event for cross-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
          detail: { entryId }
        }));
      }
      
      return true;
    } catch (error) {
      logger.error("Error deleting entry from storage:", error);
      return false;
    }
  }

  /**
   * Clean up old deleted entries (optional, can be called periodically)
   */
  public cleanupDeletedEntries(maxAgeDays: number = 30): void {
    // Implementation for future cleanup of old deleted entry IDs
    // Can be implemented later if needed
    logger.debug(`Cleanup requested for entries older than ${maxAgeDays} days`);
  }
}

// Create and export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Initialize the service
if (typeof window !== 'undefined') {
  unifiedTimeEntryService.init();
}
