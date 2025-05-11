
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { TimeEntryServiceConfig } from './types';
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate } from '../validation/dateValidation';
import { EventManager } from "./event-handling";
import { 
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY,
  loadEntriesFromStorage,
  saveEntriesToStorage,
  loadDeletedEntries,
  addToDeletedEntries
} from "./storage-operations";
import { validateTimeEntry, autoCalculateHours, calculateTotalHours } from './entry-validation';
import { TimeEntryOperations } from "./time-entry-operations";

const logger = createTimeLogger('TimeEntryService');

/**
 * Unified Time Entry Service
 * This is the main entry point for all time entry operations
 */
export class TimeEntryService {
  private eventManager: EventManager;
  private cache: {
    entries: TimeEntry[];
    userEntries: Record<string, TimeEntry[]>;
    dayEntries: Record<string, TimeEntry[]>; 
    monthEntries: Record<string, TimeEntry[]>;
    timestamp: number;
    isValid: boolean;
  };
  private config: Required<TimeEntryServiceConfig>;
  private isInitialized = false;
  private deletedEntryIds: string[] = [];
  private storageCleanupFn: (() => void) | null = null;
  private operations: TimeEntryOperations;

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
    this.cache = {
      entries: [],
      userEntries: {},
      dayEntries: {},
      monthEntries: {},
      timestamp: 0,
      isValid: false
    };
    
    // Create operations with proper configuration
    this.operations = new TimeEntryOperations(
      {
        serviceName: 'TimeEntryService',
        storageKey: this.config.storageKey,
        validateOnSave: this.config.validateOnAccess,
        enableAuditing: this.config.enableAuditing,
        enableCache: this.config.enableCaching
      },
      this.invalidateCache.bind(this),
      () => this.getAllEntries(),
      this.eventManager
    );

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

  public addEventListener(type: string, listener: (event: any) => void): () => void {
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
    if (!this.config.enableCaching) return false;
    if (!this.cache.isValid) return false;
    
    const now = Date.now();
    return (now - this.cache.timestamp) < this.config.cacheTTL;
  }

  private loadDeletedEntries(): void {
    this.deletedEntryIds = loadDeletedEntries(DELETED_ENTRIES_KEY);
  }

  public getDeletedEntryIds(): string[] {
    return [...this.deletedEntryIds];
  }

  public getAllEntries(): TimeEntry[] {
    try {
      if (this.isCacheValid()) {
        return [...this.cache.entries];
      }

      const entries = loadEntriesFromStorage(this.config.storageKey, this.deletedEntryIds);
      
      this.cache = {
        ...this.cache,
        entries,
        timestamp: Date.now(),
        isValid: true
      };
      
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
    if (!date || isNaN(date.getTime())) {
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
    
    // Filter by date
    const dayEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    // Update cache
    this.cache.dayEntries[cacheKey] = dayEntries;
    
    return [...dayEntries];
  }

  public getMonthEntries(date: Date, userId: string): TimeEntry[] {
    if (!date || isNaN(date.getTime())) {
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

  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    return this.operations.createEntry(entryData, this.deletedEntryIds);
  }

  public updateEntry(entryId: string, updates: Partial<TimeEntry>): boolean {
    return this.operations.updateEntry(entryId, updates, this.deletedEntryIds);
  }

  public async deleteEntry(entryId: string): Promise<boolean> {
    return this.operations.deleteEntry(entryId, this.deletedEntryIds);
  }

  public calculateTotalHours(entries: TimeEntry[]): number {
    return calculateTotalHours(entries);
  }

  public autoCalculateHours(startTime: string, endTime: string): number {
    return autoCalculateHours(startTime, endTime);
  }

  public validateEntry(entry: Partial<TimeEntry>) {
    return validateTimeEntry(entry);
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

  public cleanupDeletedEntries(maxAgeDays: number = 30): void {
    logger.debug(`Cleanup requested for entries older than ${maxAgeDays} days`);
    // Implementation would go here
  }
}

// Create and export a singleton instance
export const timeEntryService = new TimeEntryService();

// Initialize the service if we're in browser environment
if (typeof window !== 'undefined') {
  timeEntryService.init();
}

// Export constants - no duplicate exports now
export { 
  STORAGE_KEY,
  DELETED_ENTRIES_KEY
};

// Factory function to create a new service instance
export function createTimeEntryService(config?: TimeEntryServiceConfig): TimeEntryService {
  const service = new TimeEntryService(config);
  service.init();
  return service;
}

// Export utility functions
export {
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
};

// Also export the singleton as unifiedTimeEntryService for backward compatibility
export const unifiedTimeEntryService = timeEntryService;

// Export the storageWriteLock for other modules to use
export { storageWriteLock } from './storage-operations';

// Export the TimeEntryEvent type for consuming modules
export type { TimeEntryEvent } from './types';

