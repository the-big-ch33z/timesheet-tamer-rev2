import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { 
  TimeEntryEvent, 
  TimeEntryEventType, 
  TimeEntryServiceConfig, 
  EntryCache 
} from "./types";
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate } from '../validation/dateValidation';
import { EventManager } from "./event-handling";
import { 
  createEmptyCache,
  isCacheValid, 
  invalidateCache, 
  updateCacheEntries,
} from "./cache-management";
import {
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  loadEntriesFromStorage,
  saveEntriesToStorage,
  loadDeletedEntries,
  addToDeletedEntries
} from "./storage-operations";
import { validateTimeEntry, autoCalculateHours, calculateTotalHours } from "./entry-validation";
import { TimeEntryOperations } from "./time-entry-operations";
import { TimeEntryQueries } from "./time-entry-queries";

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
  private operations: TimeEntryOperations;
  private queries: TimeEntryQueries;

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
    
    // Create operations and queries
    this.operations = new TimeEntryOperations(
      {
        serviceName: 'UnifiedTimeEntryService',
        storageKey: this.config.storageKey
      }, // Add the required serviceName property
      this.invalidateCache.bind(this),
      () => this.getAllEntries(),
      this.eventManager
    );
    
    this.queries = new TimeEntryQueries(this.cache, this.config);

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
    return this.queries.getUserEntries(userId, this.getAllEntries());
  }

  public getDayEntries(date: Date, userId: string): TimeEntry[] {
    return this.queries.getDayEntries(date, userId, this.getUserEntries(userId));
  }

  public getMonthEntries(date: Date, userId: string): TimeEntry[] {
    return this.queries.getMonthEntries(date, userId, this.getUserEntries(userId));
  }

  public createEntry(entryData: Omit<TimeEntry, "id">): string | null {
    return this.operations.createEntry(entryData, this.deletedEntryIds);
  }

  public updateEntry(entryId: string, updates: Partial<TimeEntry>): boolean {
    return this.operations.updateEntry(entryId, updates, this.deletedEntryIds);
  }

  public deleteEntry(entryId: string): Promise<boolean> {
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
  }
}
