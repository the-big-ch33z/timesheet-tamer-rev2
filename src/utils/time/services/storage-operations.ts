
import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('TimeEntryStorageOps');

// Constants for storage
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Lock mechanism to prevent simultaneous writes to localStorage
export const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null,
  acquire: function(): boolean {
    if (this.isLocked) return false;
    
    this.isLocked = true;
    
    // Auto-release lock after 2 seconds as a safety measure
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.lockTimeout = setTimeout(() => {
      this.release();
      console.warn("[TimeEntryStorage] Storage lock auto-released after timeout");
    }, 2000);
    
    return true;
  },
  release: function(): void {
    this.isLocked = false;
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
  }
};

/**
 * Load entries from localStorage
 */
export function loadEntriesFromStorage(
  storageKey: string = STORAGE_KEY,
  deletedIds: string[] = []
): TimeEntry[] {
  try {
    // Load from storage
    const savedEntries = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(storageKey) 
      : null;
    
    let entries: TimeEntry[] = [];
    
    if (savedEntries) {
      // Parse entries
      const parsedEntries = JSON.parse(savedEntries);
      
      // Filter out deleted entries
      entries = parsedEntries
        .filter((entry: any) => !deletedIds.includes(entry.id))
        .map((entry: any) => {
          // Ensure date is a valid Date object
          const entryDate = entry.date ? new Date(entry.date) : new Date();
          
          return {
            ...entry,
            date: entryDate
          };
        });
      
      logger.debug(`Loaded ${entries.length} entries from storage`);
    } else {
      // Initialize with empty array
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
      logger.debug('No entries found in storage');
    }
    
    return entries;
  } catch (error) {
    logger.error('Error loading entries from storage', error);
    return [];
  }
}

/**
 * Save entries to localStorage
 */
export function saveEntriesToStorage(
  entries: TimeEntry[],
  storageKey: string = STORAGE_KEY,
  deletedIds: string[] = []
): boolean {
  if (!storageWriteLock.acquire()) {
    logger.debug('Storage write lock busy');
    return false;
  }
  
  try {
    // Filter out any entries that are in the deleted list
    const filteredEntries = entries.filter(entry => 
      !deletedIds.includes(entry.id)
    );
    
    // Save to storage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(filteredEntries));
    }
    
    logger.debug(`Saved ${filteredEntries.length} entries to storage`);
    return true;
  } catch (error) {
    logger.error('Error saving entries to storage', error);
    return false;
  } finally {
    storageWriteLock.release();
  }
}

/**
 * Load deleted entry IDs from storage
 */
export function loadDeletedEntries(
  storageKey: string = DELETED_ENTRIES_KEY
): string[] {
  try {
    const deletedEntries = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(storageKey) 
      : null;
      
    if (deletedEntries) {
      const ids = JSON.parse(deletedEntries);
      logger.debug(`Loaded ${ids.length} deleted entry IDs`);
      return ids;
    } else {
      return [];
    }
  } catch (error) {
    logger.error('Error loading deleted entries', error);
    return [];
  }
}

/**
 * Save deleted entry IDs to storage
 */
export function saveDeletedEntries(
  deletedIds: string[],
  storageKey: string = DELETED_ENTRIES_KEY
): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(deletedIds));
    }
    logger.debug(`Saved ${deletedIds.length} deleted entry IDs`);
    return true;
  } catch (error) {
    logger.error('Error saving deleted entries', error);
    return false;
  }
}

/**
 * Add an entry ID to the deleted entries list
 */
export function addToDeletedEntries(
  entryId: string,
  deletedIds: string[],
  storageKey: string = DELETED_ENTRIES_KEY
): string[] {
  try {
    if (!deletedIds.includes(entryId)) {
      const newDeletedIds = [...deletedIds, entryId];
      saveDeletedEntries(newDeletedIds, storageKey);
      logger.debug(`Added entry ${entryId} to deleted list`);
      return newDeletedIds;
    }
    return deletedIds;
  } catch (error) {
    logger.error('Error adding to deleted entries', error);
    return deletedIds;
  }
}
