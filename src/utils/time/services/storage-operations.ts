
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../errors/timeLogger";

const logger = createTimeLogger('storage-operations');

// Storage keys
export const STORAGE_KEY = 'time-entries';
export const DELETED_ENTRIES_KEY = 'time-entries-deleted';
export const CACHE_TIMESTAMP_KEY = 'time-entries-cache-timestamp';

// Write lock mechanism to prevent simultaneous writes
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
 * Enhanced load entries function with error recovery and validation
 */
export const loadEntriesFromStorage = (
  storageKey: string = STORAGE_KEY, 
  deletedEntryIds: string[] = []
): TimeEntry[] => {
  try {
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      logger.debug('No entries found in storage');
      return [];
    }
    
    const entries: TimeEntry[] = JSON.parse(storedData);
    
    // Validate data integrity
    if (!Array.isArray(entries)) {
      logger.error('Invalid storage data: not an array');
      return [];
    }
    
    // Filter out deleted entries
    const filteredEntries = entries.filter(entry => 
      entry && entry.id && !deletedEntryIds.includes(entry.id)
    );
    
    // Validate basic structure
    const validEntries = filteredEntries.filter(entry => {
      // Ensure minimum required fields exist
      if (!entry.id || !entry.userId || !entry.date) {
        return false;
      }
      
      // Ensure date is parseable
      try {
        if (!(entry.date instanceof Date)) {
          new Date(entry.date);
        }
        return true;
      } catch (e) {
        return false;
      }
    });
    
    if (validEntries.length !== filteredEntries.length) {
      logger.warn(`Found ${filteredEntries.length - validEntries.length} invalid entries which were excluded`);
    }
    
    // Update timestamp of last successful load
    try {
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      logger.debug('Could not update cache timestamp', e);
    }
    
    logger.debug(`Loaded ${validEntries.length} entries from storage`);
    return validEntries;
    
  } catch (error) {
    logger.error('Error loading entries from storage', error);
    
    // Attempt to recover from corrupted storage
    try {
      // Store the error state to prevent repeated failures
      localStorage.setItem('error-state', JSON.stringify({
        time: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      }));
    } catch (e) {
      // Silently fail if we can't even store the error state
    }
    
    return [];
  }
};

/**
 * Enhanced save entries function with retries
 */
export const saveEntriesToStorage = async (
  entries: TimeEntry[], 
  storageKey: string = STORAGE_KEY,
  deletedEntryIds: string[] = []
): Promise<boolean> => {
  let retries = 0;
  const MAX_RETRIES = 3;
  
  while (retries < MAX_RETRIES) {
    try {
      // Acquire write lock
      await storageWriteLock.acquire();
      
      // Filter out deleted entries before saving
      const filteredEntries = entries.filter(entry => 
        entry && entry.id && !deletedEntryIds.includes(entry.id)
      );
      
      // Serialize and store
      localStorage.setItem(storageKey, JSON.stringify(filteredEntries));
      logger.debug(`Saved ${filteredEntries.length} entries to storage`);
      
      // Update timestamp of last successful save
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      
      return true;
    } catch (error) {
      retries++;
      logger.error(`Error saving entries (attempt ${retries}):`, error);
      
      if (retries >= MAX_RETRIES) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
    } finally {
      // Always release the lock
      storageWriteLock.release();
    }
  }
  
  return false;
};

/**
 * Load deleted entry IDs
 */
export const loadDeletedEntries = (storageKey: string = DELETED_ENTRIES_KEY): string[] => {
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
};

/**
 * Add an entry ID to deleted entries
 */
export const addToDeletedEntries = async (
  entryId: string,
  currentDeletedIds: string[] = [],
  storageKey: string = DELETED_ENTRIES_KEY
): Promise<string[]> => {
  // Acquire write lock
  await storageWriteLock.acquire();
  
  try {
    // Refresh the list from storage in case it changed
    let deletedEntries = loadDeletedEntries(storageKey);
    
    // Merge with provided IDs
    currentDeletedIds.forEach(id => {
      if (!deletedEntries.includes(id)) {
        deletedEntries.push(id);
      }
    });
    
    // Add new ID if not already included
    if (!deletedEntries.includes(entryId)) {
      deletedEntries.push(entryId);
      
      // Save updated list
      localStorage.setItem(storageKey, JSON.stringify(deletedEntries));
      logger.debug(`Added entry ID ${entryId} to deleted entries`);
    }
    
    return deletedEntries;
  } catch (error) {
    logger.error('Error adding to deleted entries', error);
    
    // Return original list plus the new ID as best effort
    if (!currentDeletedIds.includes(entryId)) {
      return [...currentDeletedIds, entryId];
    }
    return currentDeletedIds;
  } finally {
    // Always release the lock
    storageWriteLock.release();
  }
};
