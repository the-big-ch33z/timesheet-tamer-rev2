import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('storage-operations');

// Storage keys
export const STORAGE_KEY = 'time-entries';
export const DELETED_ENTRIES_KEY = 'time-entries-deleted';

// Lock to prevent concurrent writes
export const storageWriteLock = {
  isLocked: false,
  lockTime: 0,
  lockTimeout: 5000, // 5 seconds max lock time
  
  acquire(): boolean {
    if (this.isLocked) {
      const now = Date.now();
      if (now - this.lockTime > this.lockTimeout) {
        // Force unlock if timeout exceeded
        logger.warn('Force releasing expired storage write lock');
        this.release();
        return this.acquire();
      }
      return false;
    }
    
    this.isLocked = true;
    this.lockTime = Date.now();
    return true;
  },
  
  release(): void {
    this.isLocked = false;
  }
};

// Load entries from storage
export function loadEntriesFromStorage(
  storageKey: string = STORAGE_KEY, 
  deletedIds: string[] = []
): TimeEntry[] {
  try {
    const entriesJson = localStorage.getItem(storageKey);
    if (!entriesJson) return [];
    
    const parsed = JSON.parse(entriesJson);
    const entries = Array.isArray(parsed) ? parsed : (parsed.entries || []);
    
    // Filter out deleted entries
    if (deletedIds.length > 0) {
      return entries.filter(entry => !deletedIds.includes(entry.id));
    }
    
    return entries;
  } catch (error) {
    logger.error('Error loading entries from storage', error);
    return [];
  }
}

// Load deleted entry IDs
export function loadDeletedEntries(deletedKey: string = DELETED_ENTRIES_KEY): string[] {
  try {
    const deletedJson = localStorage.getItem(deletedKey);
    if (!deletedJson) return [];
    
    const parsed = JSON.parse(deletedJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error('Error loading deleted entries', error);
    return [];
  }
}

// Save entries to storage with lock mechanism
export async function saveEntriesToStorage(
  entries: TimeEntry[],
  storageKey: string = STORAGE_KEY,
  deletedIds: string[] = []
): Promise<boolean> {
  if (!storageWriteLock.acquire()) {
    logger.warn('Could not acquire storage write lock');
    return false;
  }
  
  try {
    // Filter out deleted entries before saving
    const entriesToSave = entries.filter(entry => !deletedIds.includes(entry.id));
    
    localStorage.setItem(storageKey, JSON.stringify(entriesToSave));
    return true;
  } catch (error) {
    logger.error('Error saving entries to storage', error);
    return false;
  } finally {
    storageWriteLock.release();
  }
}

// Add an entry ID to the deleted entries list
export async function addToDeletedEntries(
  entryId: string,
  currentDeletedIds: string[] = [],
  deletedKey: string = DELETED_ENTRIES_KEY
): Promise<string[]> {
  if (!entryId) return currentDeletedIds;
  
  if (!storageWriteLock.acquire()) {
    logger.warn('Could not acquire storage write lock for deletion');
    return currentDeletedIds;
  }
  
  try {
    // Get the current list or use the provided one
    let deletedIds = currentDeletedIds.length > 0 
      ? [...currentDeletedIds] 
      : loadDeletedEntries(deletedKey);
    
    // Add the new ID if it's not already in the list
    if (!deletedIds.includes(entryId)) {
      deletedIds.push(entryId);
      localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
    }
    
    return deletedIds;
  } catch (error) {
    logger.error('Error adding entry to deleted list', error);
    return currentDeletedIds;
  } finally {
    storageWriteLock.release();
  }
}

// Clean up entries based on age
export function cleanupDeletedEntries(
  maxAgeDays: number = 30,
  deletedKey: string = DELETED_ENTRIES_KEY
): void {
  // Implementation to remove old entries from the deleted list
  logger.debug('Cleanup function called but not implemented');
}
