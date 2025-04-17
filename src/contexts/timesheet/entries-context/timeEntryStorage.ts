
import { TimeEntry } from "@/types";
import { 
  unifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from "@/utils/time/services/unifiedTimeEntryService";

// Re-export storage key constants for consistency
export { STORAGE_KEY, DELETED_ENTRIES_KEY, storageWriteLock };

/**
 * DEPRECATED: This module is maintained only for backward compatibility
 * @deprecated Use unifiedTimeEntryService directly instead
 */

// Simple redirects to the unified service
export const getDeletedEntryIds = unifiedTimeEntryService.getDeletedEntryIds;
export const addToDeletedEntries = unifiedTimeEntryService.deleteEntryFromStorage;
export const cleanupDeletedEntries = unifiedTimeEntryService.cleanupDeletedEntries;
export const loadEntriesFromStorage = unifiedTimeEntryService.getAllEntries;
export const saveEntriesToStorage = unifiedTimeEntryService.saveEntriesToStorage;
export const deleteEntryFromStorage = unifiedTimeEntryService.deleteEntryFromStorage;

