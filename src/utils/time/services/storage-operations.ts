
import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';
import { storageWriteLock } from './storage-lock';

const logger = createTimeLogger('storage-operations');

// Storage keys
export const STORAGE_KEY = 'time-entries';
export const DELETED_ENTRIES_KEY = 'time-entries-deleted';
export const CACHE_TIMESTAMP_KEY = 'time-entries-cache-timestamp';

// Re-export the lock
export { storageWriteLock };

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
