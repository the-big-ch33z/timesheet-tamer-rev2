import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate, isValidDate, formatDateForComparison } from '../validation/dateValidation';

// Consolidated type definitions from 'types.ts'
export type TimeEntryEventType = 
  | 'entry-created' 
  | 'entry-updated'
  | 'entry-deleted'
  | 'entries-loaded'
  | 'storage-sync'
  | 'error'
  | 'all';

export interface TimeEntryEvent {
  type: TimeEntryEventType;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

export type TimeEntryEventListener = (event: TimeEntryEvent) => void;

export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

export interface EntryCache {
  entries: TimeEntry[];
  userEntries: Record<string, TimeEntry[]>;
  dayEntries: Record<string, TimeEntry[]>; 
  monthEntries: Record<string, TimeEntry[]>;
  timestamp: number;
  isValid: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Storage constants moved from storage-operations.ts
export const STORAGE_KEY = 'time-entries';
export const DELETED_ENTRIES_KEY = 'time-entries-deleted';
export const CACHE_TIMESTAMP_KEY = 'time-entries-cache-timestamp';

const logger = createTimeLogger('UnifiedTimeEntryService');

/**
 * Enhanced event manager for time entry operations
 * Consolidated from event-handling.ts
 */
export class EventManager {
  private eventListeners: Map<TimeEntryEventType, Set<TimeEntryEventListener>> = new Map();

  public addEventListener(
    type: TimeEntryEventType, 
    listener: TimeEntryEventListener
  ): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    const listeners = this.eventListeners.get(type)!;
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    };
  }

  public dispatchEvent(event: TimeEntryEvent): void {
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

    const allListeners = this.eventListeners.get('all');
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

  public setupStorageListener(
    storageKey: string, 
    onStorageChange: () => void,
    onDeletedEntriesChange: () => void,
    deletedEntriesKey: string
  ): () => void {
    const handleStorageEvent = (event: StorageEvent): void => {
      if (event.key === storageKey) {
        onStorageChange();
        this.dispatchEvent({
          type: 'storage-sync',
          timestamp: new Date(),
          payload: { source: 'storage-event' }
        });
      } else if (event.key === deletedEntriesKey) {
        onDeletedEntriesChange();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
      return () => {
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
    
    return () => {};
  }

  public clear(): void {
    this.eventListeners.clear();
  }
}

// Write lock mechanism consolidated from storage-operations.ts
let writeInProgress = false;
let writeQueue: (() => Promise<void>)[] = [];

export const storageWriteLock = {
  acquire: async (): Promise<boolean> => {
    if (writeInProgress) {
      return new Promise<boolean>(resolve => {
        const queuedWrite = async () => {
          resolve(true);
        };
        writeQueue.push(queuedWrite);
      });
    }
    
    writeInProgress = true;
    return true;
  },
  
  release: (): void => {
    writeInProgress = false;
    
    if (writeQueue.length > 0) {
      const nextWrite = writeQueue.shift();
      if (nextWrite) {
        writeInProgress = true;
        nextWrite().catch(error => {
          logger.error("Error in queued write:", error);
          storageWriteLock.release();
        });
      }
    }
  }
};

/**
 * Consolidated cache management functions
 */
export function createEmptyCache(): EntryCache {
  return {
    entries: [],
    userEntries: {},
    dayEntries: {},
    monthEntries: {},
    timestamp: 0,
    isValid: false
  };
}

export function isCacheValid(
  cache: EntryCache,
  enableCaching: boolean,
  cacheTTL: number
): boolean {
  if (!enableCaching) return false;
  if (!cache || !cache.isValid) return false;
  
  const now = Date.now();
  return (now - cache.timestamp) < cacheTTL;
}

export function updateCacheEntries(
  cache: EntryCache,
  entries: TimeEntry[]
): EntryCache {
  return {
    ...cache,
    entries: [...entries],
    timestamp: Date.now(),
    isValid: true
  };
}

/**
 * Consolidated validation functions from entry-validation.ts
 */
export function validateTimeEntry(entry: Partial<TimeEntry>): ValidationResult {
  if (!entry.hours || entry.hours <= 0) {
    return {
      valid: false,
      message: "Hours must be greater than 0"
    };
  }

  if (!entry.date) {
    return {
      valid: false,
      message: "Date is required"
    };
  }

  return { valid: true };
}

export function autoCalculateHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  const minutes = endMinute - startMinute;
  
  hours += minutes / 60;
  
  return Math.max(0, parseFloat(hours.toFixed(2)));
}

export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
}

/**
 * Consolidated storage operations
 */
export function loadEntriesFromStorage(
  storageKey: string = STORAGE_KEY, 
  deletedEntryIds: string[] = []
): TimeEntry[] {
  try {
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return [];
    }
    
    const entries: TimeEntry[] = JSON.parse(storedData);
    
    if (!Array.isArray(entries)) {
      logger.error('Invalid storage data: not an array');
      return [];
    }
    
    const filteredEntries = entries.filter(entry => 
      entry && entry.id && !deletedEntryIds.includes(entry.id)
    );
    
    const validEntries = filteredEntries.filter(entry => {
      if (!entry.id || !entry.userId || !entry.date) {
        return false;
      }
      
      try {
        if (!(entry.date instanceof Date)) {
          new Date(entry.date);
        }
        return true;
      } catch (e) {
        return false;
      }
    });
    
    try {
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      logger.debug('Could not update cache timestamp', e);
    }
    
    return validEntries;
    
  } catch (error) {
    logger.error('Error loading entries from storage', error);
    
    try {
      localStorage.setItem('error-state', JSON.stringify({
        time: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      }));
    } catch (e) {
      // Silently fail
    }
    
    return [];
  }
}

export async function saveEntriesToStorage(
  entries: TimeEntry[], 
  storageKey: string = STORAGE_KEY,
  deletedEntryIds: string[] = []
): Promise<boolean> {
  let retries = 0;
  const MAX_RETRIES = 3;
  
  while (retries < MAX_RETRIES) {
    try {
      await storageWriteLock.acquire();
      
      const filteredEntries = entries.filter(entry => 
        entry && entry.id && !deletedEntryIds.includes(entry.id)
      );
      
      localStorage.setItem(storageKey, JSON.stringify(filteredEntries));
      
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      
      return true;
    } catch (error) {
      retries++;
      logger.error(`Error saving entries (attempt ${retries}):`, error);
      
      if (retries >= MAX_RETRIES) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
    } finally {
      storageWriteLock.release();
    }
  }
  
  return false;
}

export function loadDeletedEntries(storageKey: string = DELETED_ENTRIES_KEY): string[] {
  try {
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return [];
    }
    
    const deletedEntries = JSON.parse(storedData);
    
    if (!Array.isArray(deletedEntries)) {
      logger.error('Invalid deleted entries data: not an array');
      return [];
    }
    
    return deletedEntries.filter(id => typeof id === 'string');
    
  } catch (error) {
    logger.error('Error loading deleted entries', error);
    return [];
  }
}

export async function addToDeletedEntries(
  entryId: string,
  currentDeletedIds: string[] = [],
  storageKey: string = DELETED_ENTRIES_KEY
): Promise<string[]> {
  await storageWriteLock.acquire();
  
  try {
    let deletedEntries = loadDeletedEntries(storageKey);
    
    currentDeletedIds.forEach(id => {
      if (!deletedEntries.includes(id)) {
        deletedEntries.push(id);
      }
    });
    
    if (!deletedEntries.includes(entryId)) {
      deletedEntries.push(entryId);
      
      localStorage.setItem(storageKey, JSON.stringify(deletedEntries));
    }
    
    return deletedEntries;
  } catch (error) {
    logger.error('Error adding to deleted entries', error);
    
    if (!currentDeletedIds.includes(entryId)) {
      return [...currentDeletedIds, entryId];
    }
    return currentDeletedIds;
  } finally {
    storageWriteLock.release();
  }
}

/**
 * Unified Time Entry Service
 * 
 * This class consolidates functionality from:
 * - UnifiedTimeEntryService
 * - TimeEntryOperations
 * - TimeEntryQueries
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
    
    // Auto-initialize if we're in a browser
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
    this.invalidateCache();
    this.isInitialized = false;
    logger.debug('Service destroyed');
  }

  public addEventListener(type: TimeEntryEventType, listener: (event: TimeEntryEvent) => void): () => void {
    return this.eventManager.addEventListener(type, listener);
  }

  private invalidateCache(): void {
    this.cache = {
      ...this.cache,
      isValid: false,
      timestamp: 0,
      userEntries: {},
      dayEntries: {},
      monthEntries: {}
    };
  }

  private isCacheValid(): boolean {
    return isCacheValid(this.cache, this.config.enableCaching, this.config.cacheTTL);
  }

  private loadDeletedEntries(): void {
    this.deletedEntryIds = loadDeletedEntries(DELETED_ENTRIES_KEY);
  }

  public getDeletedEntryIds(): string[] {
    return [...this.deletedEntryIds];
  }

  /** 
   * Core entry access methods
   */
  public getAllEntries(): TimeEntry[] {
    try {
      if (this.isCacheValid()) {
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

  /**
   * Query operations
   */
  public getUserEntries(userId: string): TimeEntry[] {
    if (!userId) {
      logger.warn('No userId provided to getUserEntries');
      return [];
    }
    
    // Check cache first
    if (this.cache.userEntries[userId]) {
      return [...this.cache.userEntries[userId]];
    }
    
    // Filter entries for the user
    const userEntries = this.getAllEntries().filter(entry => entry.userId === userId);
    
    // Update cache
    this.cache.userEntries[userId] = userEntries;
    
    return [...userEntries];
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
    
    // Get user entries first
    const userEntries = this.getUserEntries(userId);
    
    // Generate cache key
    const cacheKey = `${userId}-${date.toDateString()}`;
    
    // Check cache first
    if (this.cache.dayEntries[cacheKey]) {
      return [...this.cache.dayEntries[cacheKey]];
    }
    
    // Filter by date using our consistent comparison
    const dayEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    // Update cache
    this.cache.dayEntries[cacheKey] = dayEntries;
    
    return [...dayEntries];
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
    
    // Get user entries first
    const userEntries = this.getUserEntries(userId);
    
    // Generate cache key
    const cacheKey = `${userId}-${date.getFullYear()}-${date.getMonth()}`;
    
    // Check cache first
    if (this.cache.monthEntries[cacheKey]) {
      return [...this.cache.monthEntries[cacheKey]];
    }
    
    // Filter by month
    const monthEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return (
        entryDate.getMonth() === date.getMonth() && 
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Update cache
    this.cache.monthEntries[cacheKey] = monthEntries;
    
    return [...monthEntries];
  }

  /**
   * CRUD operations
   */
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
            this.invalidateCache();
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
      const updatedEntry = {
        ...originalEntry,
        ...updates
      };
      
      allEntries[entryIndex] = updatedEntry;
      
      saveEntriesToStorage(allEntries, this.config.storageKey, this.deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
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
      
      // Add to deleted entries list
      const updatedDeletedIds = await addToDeletedEntries(
        entryId, 
        this.deletedEntryIds,
        DELETED_ENTRIES_KEY
      );
      
      this.deletedEntryIds = updatedDeletedIds;
      
      // Save the updated entries list
      const savedEntries = await saveEntriesToStorage(
        updatedEntries, 
        this.config.storageKey, 
        this.deletedEntryIds
      );
      
      if (savedEntries) {
        this.invalidateCache();
        this.dispatchEntryEvent('entry-deleted', {
          entryId,
          entry: entryToDelete
        }, entryToDelete.userId);
        
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

  /**
   * Storage operations
   */
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

  public async deleteEntryFromStorage(entryId: string): Promise<boolean> {
    logger.debug("Direct deletion of entry from storage:", entryId);
    
    try {
      const updatedIds = await addToDeletedEntries(entryId, this.deletedEntryIds, DELETED_ENTRIES_KEY);
      this.deletedEntryIds = updatedIds;
      
      this.invalidateCache();
      
      return true;
    } catch (error) {
      logger.error("Error deleting entry from storage:", error);
      return false;
    }
  }

  /**
   * Utility methods
   */
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
    // Implementation would go here - keeping this as a stub for compatibility
  }

  /**
   * Event helper methods
   */
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
