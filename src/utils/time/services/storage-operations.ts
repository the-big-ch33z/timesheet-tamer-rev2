
import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('TimeEntryStorageOps');

// Constants for storage
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Enhanced lock mechanism with promise-based queuing to prevent simultaneous writes to localStorage
export const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null,
  lockQueue: [] as Array<() => void>,
  
  acquire: function(): Promise<boolean> {
    // Return a promise that resolves when the lock is acquired
    return new Promise<boolean>((resolve) => {
      if (!this.isLocked) {
        // Lock is available, acquire it immediately
        this._acquireLock();
        resolve(true);
      } else {
        // Lock is busy, add to queue
        logger.debug('Storage write lock busy, queuing operation');
        this.lockQueue.push(() => {
          this._acquireLock();
          resolve(true);
        });
      }
    });
  },
  
  _acquireLock: function(): void {
    this.isLocked = true;
    
    // Auto-release lock after 2 seconds as a safety measure
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.lockTimeout = setTimeout(() => {
      this._releaseLock();
      console.warn("[TimeEntryStorage] Storage lock auto-released after timeout");
    }, 2000);
  },
  
  _releaseLock: function(): void {
    this.isLocked = false;
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
    
    // Process next item in queue if any
    const next = this.lockQueue.shift();
    if (next) {
      setTimeout(next, 0); // Use setTimeout to prevent call stack issues
    }
  },
  
  release: function(): void {
    this._releaseLock();
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
 * Save entries to localStorage using async/await pattern
 */
export async function saveEntriesToStorage(
  entries: TimeEntry[],
  storageKey: string = STORAGE_KEY,
  deletedIds: string[] = []
): Promise<boolean> {
  try {
    // Acquire lock (returns a promise now)
    const lockAcquired = await storageWriteLock.acquire();
    if (!lockAcquired) {
      logger.debug('Failed to acquire storage write lock');
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
    } finally {
      // Always release the lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error saving entries to storage', error);
    // In case of error, make sure the lock gets released
    storageWriteLock.release();
    return false;
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
 * Save deleted entry IDs to storage with Promise-based locking
 */
export async function saveDeletedEntries(
  deletedIds: string[],
  storageKey: string = DELETED_ENTRIES_KEY
): Promise<boolean> {
  try {
    // Acquire lock
    const lockAcquired = await storageWriteLock.acquire();
    if (!lockAcquired) {
      logger.debug('Failed to acquire storage write lock for deleted entries');
      return false;
    }
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(deletedIds));
      }
      logger.debug(`Saved ${deletedIds.length} deleted entry IDs`);
      return true;
    } finally {
      // Always release the lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error saving deleted entries', error);
    // In case of error, make sure the lock gets released
    storageWriteLock.release();
    return false;
  }
}

/**
 * Add an entry ID to the deleted entries list - async/await pattern
 */
export async function addToDeletedEntries(
  entryId: string,
  deletedIds: string[],
  storageKey: string = DELETED_ENTRIES_KEY
): Promise<string[]> {
  try {
    if (!deletedIds.includes(entryId)) {
      const newDeletedIds = [...deletedIds, entryId];
      await saveDeletedEntries(newDeletedIds, storageKey);
      logger.debug(`Added entry ${entryId} to deleted list`);
      return newDeletedIds;
    }
    return deletedIds;
  } catch (error) {
    logger.error('Error adding to deleted entries', error);
    return deletedIds;
  }
}
