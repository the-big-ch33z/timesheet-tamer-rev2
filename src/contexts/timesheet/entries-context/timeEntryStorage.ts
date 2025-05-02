
import { TimeEntry } from "@/types";
import { 
  unifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from "@/utils/time/services";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";

// Create a logger
const logger = createTimeLogger('timeEntryStorage');

// Re-export storage key constants for consistency
export { STORAGE_KEY, DELETED_ENTRIES_KEY, storageWriteLock };

/**
 * DEPRECATED: This module is maintained only for backward compatibility
 * @deprecated Use unifiedTimeEntryService directly instead
 */

// Safe version of loadEntriesFromStorage that doesn't crash on errors
export const loadEntriesFromStorage = (): TimeEntry[] => {
  try {
    return unifiedTimeEntryService.getAllEntries();
  } catch (error) {
    logger.error("Error in loadEntriesFromStorage:", error);
    // Return empty array instead of failing
    return [];
  }
};

// Simple redirects to the unified service
export const getDeletedEntryIds = () => unifiedTimeEntryService.getDeletedEntryIds();
export const addToDeletedEntries = (entryId: string) => unifiedTimeEntryService.deleteEntryFromStorage(entryId);
export const cleanupDeletedEntries = () => unifiedTimeEntryService.cleanupDeletedEntries();
export const saveEntriesToStorage = (entries: TimeEntry[]) => unifiedTimeEntryService.saveEntriesToStorage(entries);
export const deleteEntryFromStorage = (entryId: string) => unifiedTimeEntryService.deleteEntryFromStorage(entryId);
