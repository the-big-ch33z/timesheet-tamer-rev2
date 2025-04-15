
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { TimeCalculationError, createTimeLogger } from '../errors/timeErrorHandling';
import { ensureDate, isValidDate } from '../validation/dateValidation';
import { calculateHoursFromTimes } from '../calculations/hoursCalculations';

// Constants for storage
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Create a dedicated logger for this service
const logger = createTimeLogger('UnifiedTimeEntryService');

/**
 * Event types for the time entry service
 */
export type TimeEntryEventType = 
  | 'entry-created' 
  | 'entry-updated'
  | 'entry-deleted'
  | 'entries-loaded'
  | 'storage-sync'
  | 'error';

/**
 * Event payload for timesheet events
 */
export interface TimeEntryEvent {
  type: TimeEntryEventType;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

/**
 * Event listener callback type
 */
export type TimeEntryEventListener = (event: TimeEntryEvent) => void;

/**
 * Configuration options for the service
 */
export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;  // in milliseconds
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

/**
 * Cache container for time entries
 */
interface EntryCache {
  entries: TimeEntry[];
  userEntries: Record<string, TimeEntry[]>;
  dayEntries: Record<string, TimeEntry[]>; 
  monthEntries: Record<string, TimeEntry[]>;
  timestamp: number;
  isValid: boolean;
}

/**
 * Enhanced, unified time entry service with reactivity and caching
 */
export class UnifiedTimeEntryService {
  private eventListeners: Map<TimeEntryEventType, Set<TimeEntryEventListener>> = new Map();
  private cache: EntryCache = {
    entries: [],
    userEntries: {},
    dayEntries: {},
    monthEntries: {},
    timestamp: 0,
    isValid: false
  };
  private config: Required<TimeEntryServiceConfig>;
  private isInitialized = false;
  private deletedEntryIds: string[] = [];

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

    // Setup storage event listener for cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.eventListeners.clear();
    this.invalidateCache();
    logger.debug('Service destroyed');
  }

  /**
   * Add event listener
   */
  public addEventListener(type: TimeEntryEventType, listener: TimeEntryEventListener): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    const listeners = this.eventListeners.get(type)!;
    listeners.add(listener);
    
    // Return cleanup function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    };
  }

  /**
   * Dispatch an event to all listeners
   */
  private dispatchEvent(event: TimeEntryEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in event listener', error);
        }
      });
    }

    // Also dispatch to 'all' listeners if any
    const allListeners = this.eventListeners.get('all' as TimeEntryEventType);
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in event listener', error);
        }
      });
    }
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === this.config.storageKey) {
      // Another tab has modified the entries, invalidate cache
      this.invalidateCache();
      
      // Dispatch event for subscribers
      this.dispatchEvent({
        type: 'storage-sync',
        timestamp: new Date(),
        payload: { source: 'storage-event' }
      });
      
      logger.debug('Storage event detected, cache invalidated');
    } else if (event.key === DELETED_ENTRIES_KEY) {
      // Reload deleted entries
      this.loadDeletedEntries();
      logger.debug('Deleted entries updated from another tab');
    }
  };

  /**
   * Invalidate the cache
   */
  private invalidateCache(): void {
    this.cache.isValid = false;
    this.cache.timestamp = 0;
    this.cache.userEntries = {};
    this.cache.dayEntries = {};
    this.cache.monthEntries = {};
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.config.enableCaching) return false;
    if (!this.cache.isValid) return false;
    
    const now = Date.now();
    return (now - this.cache.timestamp) < this.config.cacheTTL;
  }

  /**
   * Load all entries from storage
   */
  public getAllEntries(): TimeEntry[] {
    // Check cache first if enabled
    if (this.isCacheValid()) {
      logger.debug('Using cached entries');
      return [...this.cache.entries];
    }

    try {
      // Load from storage
      const savedEntries = typeof localStorage !== 'undefined' 
        ? localStorage.getItem(this.config.storageKey) 
        : null;
      
      let entries: TimeEntry[] = [];
      
      if (savedEntries) {
        // Parse entries
        const parsedEntries = JSON.parse(savedEntries);
        
        // Filter out deleted entries
        entries = parsedEntries
          .filter((entry: any) => !this.deletedEntryIds.includes(entry.id))
          .map((entry: any) => {
            // Ensure date is a valid Date object
            const entryDate = ensureDate(entry.date);
            
            return {
              ...entry,
              date: entryDate || new Date()
            };
          });
        
        logger.debug(`Loaded ${entries.length} entries from storage`);
      } else {
        // Initialize with empty array
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.config.storageKey, JSON.stringify([]));
        }
        logger.debug('No entries found in storage');
      }
      
      // Update cache
      this.cache.entries = entries;
      this.cache.timestamp = Date.now();
      this.cache.isValid = true;
      
      // Dispatch event
      this.dispatchEvent({
        type: 'entries-loaded',
        timestamp: new Date(),
        payload: { count: entries.length }
      });
      
      return [...entries];
    } catch (error) {
      logger.error('Error loading entries from storage', error);
      
      // Dispatch error event
      this.dispatchEvent({
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
    
    // Check cache first
    if (this.isCacheValid() && this.cache.userEntries[userId]) {
      logger.debug(`Using cached entries for user ${userId}`);
      return [...this.cache.userEntries[userId]];
    }
    
    const allEntries = this.getAllEntries();
    const userEntries = allEntries.filter(entry => entry.userId === userId);
    
    // Update cache
    if (this.config.enableCaching) {
      this.cache.userEntries[userId] = userEntries;
    }
    
    logger.debug(`Found ${userEntries.length} entries for user ${userId}`);
    return [...userEntries];
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
    
    // Generate cache key
    const cacheKey = `${userId}-${date.toDateString()}`;
    
    // Check cache first
    if (this.isCacheValid() && this.cache.dayEntries[cacheKey]) {
      logger.debug(`Using cached entries for day ${date.toDateString()}`);
      return [...this.cache.dayEntries[cacheKey]];
    }
    
    // Get user entries and then filter by date
    const userEntries = this.getUserEntries(userId);
    
    const dayEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    // Update cache
    if (this.config.enableCaching) {
      this.cache.dayEntries[cacheKey] = dayEntries;
    }
    
    logger.debug(`Found ${dayEntries.length} entries for user ${userId} on ${date.toDateString()}`);
    return [...dayEntries];
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
    
    // Generate cache key
    const cacheKey = `${userId}-${date.getFullYear()}-${date.getMonth()}`;
    
    // Check cache first
    if (this.isCacheValid() && this.cache.monthEntries[cacheKey]) {
      logger.debug(`Using cached entries for month ${date.getFullYear()}-${date.getMonth() + 1}`);
      return [...this.cache.monthEntries[cacheKey]];
    }
    
    // Get user entries and then filter by month
    const userEntries = this.getUserEntries(userId);
    
    const monthEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return (
        entryDate.getMonth() === date.getMonth() && 
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Update cache
    if (this.config.enableCaching) {
      this.cache.monthEntries[cacheKey] = monthEntries;
    }
    
    logger.debug(`Found ${monthEntries.length} entries for month ${date.getFullYear()}-${date.getMonth() + 1}`);
    return [...monthEntries];
  }

  /**
   * Create a new entry
   */
  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    // Validate entry data
    const validation = this.validateEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      
      // Dispatch error event
      this.dispatchEvent({
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
      this.dispatchEvent({
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
      const saved = this.saveEntriesToStorage(allEntries);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
        this.dispatchEvent({
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
      this.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    } catch (error) {
      logger.error('Error creating entry', error);
      
      // Dispatch error event
      this.dispatchEvent({
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
      const saved = this.saveEntriesToStorage(allEntries);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
        this.dispatchEvent({
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
      this.dispatchEvent({
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
      this.addToDeletedEntries(entryId);
      
      // Remove the entry
      allEntries.splice(entryIndex, 1);
      
      // Save back to storage
      const saved = this.saveEntriesToStorage(allEntries);
      
      if (saved) {
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch event
        this.dispatchEvent({
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
      this.dispatchEvent({
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
    const totalHours = entries.reduce((total, entry) => {
      return total + (entry.hours || 0);
    }, 0);
    
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Validate entry data
   */
  public validateEntry(entry: Partial<TimeEntry>): { valid: boolean; message?: string } {
    // Check for required fields
    if (!entry.userId) {
      return { valid: false, message: "User ID is required" };
    }
    
    if (!entry.date) {
      return { valid: false, message: "Date is required" };
    }
    
    // Validate date
    const validDate = ensureDate(entry.date);
    if (!validDate) {
      return { valid: false, message: "Invalid date format" };
    }
    
    // Validate hours if provided
    if (entry.hours !== undefined) {
      if (isNaN(entry.hours) || entry.hours < 0) {
        return { valid: false, message: "Hours must be a positive number" };
      }
      
      // Check for unrealistically high values
      if (entry.hours > 24) {
        return { valid: false, message: "Hours cannot exceed 24 for a single entry" };
      }
    }
    
    // Validate time fields if both are provided
    if (entry.startTime && entry.endTime) {
      try {
        // This will throw if times are invalid
        calculateHoursFromTimes(entry.startTime, entry.endTime);
      } catch (error) {
        if (error instanceof TimeCalculationError) {
          return { valid: false, message: error.message };
        }
        return { valid: false, message: "Invalid time format" };
      }
    }
    
    return { valid: true };
  }

  /**
   * Auto-calculate hours from start and end times
   */
  public autoCalculateHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) {
      return 0;
    }
    
    try {
      return calculateHoursFromTimes(startTime, endTime);
    } catch (error) {
      logger.error('Error calculating hours', error);
      return 0;
    }
  }

  /**
   * Save entries to storage
   */
  private saveEntriesToStorage(entriesToSave: TimeEntry[]): boolean {
    try {
      // Filter out any entries that are in the deleted list
      const filteredEntries = entriesToSave.filter(entry => 
        !this.deletedEntryIds.includes(entry.id)
      );
      
      // Save to storage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.config.storageKey, JSON.stringify(filteredEntries));
      }
      
      logger.debug(`Saved ${filteredEntries.length} entries to storage`);
      return true;
    } catch (error) {
      logger.error('Error saving entries to storage', error);
      
      // Dispatch error event
      this.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'saveEntriesToStorage' }
      });
      
      return false;
    }
  }

  /**
   * Load deleted entry IDs from storage
   */
  private loadDeletedEntries(): void {
    try {
      const deletedEntries = typeof localStorage !== 'undefined' 
        ? localStorage.getItem(DELETED_ENTRIES_KEY) 
        : null;
        
      if (deletedEntries) {
        this.deletedEntryIds = JSON.parse(deletedEntries);
        logger.debug(`Loaded ${this.deletedEntryIds.length} deleted entry IDs`);
      } else {
        this.deletedEntryIds = [];
      }
    } catch (error) {
      logger.error('Error loading deleted entries', error);
      this.deletedEntryIds = [];
    }
  }

  /**
   * Add an entry ID to the deleted entries list
   */
  private addToDeletedEntries(entryId: string): void {
    try {
      if (!this.deletedEntryIds.includes(entryId)) {
        this.deletedEntryIds.push(entryId);
        
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(DELETED_ENTRIES_KEY, JSON.stringify(this.deletedEntryIds));
        }
        
        logger.debug(`Added entry ${entryId} to deleted list`);
      }
    } catch (error) {
      logger.error('Error adding to deleted entries', error);
    }
  }
}

// Create and export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Initialize the service
if (typeof window !== 'undefined') {
  unifiedTimeEntryService.init();
}
