
import { TimeEntry } from "@/types";
import { ensureDate } from "@/utils/time/validation";
import { 
  unifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from "@/utils/time/services/unifiedTimeEntryService";

// Re-export storage key constants for consistency
export { STORAGE_KEY, DELETED_ENTRIES_KEY };

// Re-export storage write lock
export { storageWriteLock };

/**
 * DEPRECATED: This module now redirects all operations to unifiedTimeEntryService
 * @deprecated Use unifiedTimeEntryService directly instead
 */

// Get the list of deleted entry IDs
export const getDeletedEntryIds = (): string[] => {
  return unifiedTimeEntryService.getDeletedEntryIds();
};

// Add an entry ID to the deleted entries list
export const addToDeletedEntries = (entryId: string): void => {
  // This operation is now handled within unifiedTimeEntryService
  unifiedTimeEntryService.deleteEntryFromStorage(entryId);
};

// Clean up old deleted entries (optional, can be called periodically)
export const cleanupDeletedEntries = (maxAgeDays: number = 30): void => {
  unifiedTimeEntryService.cleanupDeletedEntries(maxAgeDays);
};

// Load entries from localStorage with deleted entry filtering
export const loadEntriesFromStorage = (): TimeEntry[] => {
  return unifiedTimeEntryService.getAllEntries();
};

// Save entries to localStorage with conflict resolution
export const saveEntriesToStorage = (entriesToSave: TimeEntry[], isInitialized: boolean): boolean => {
  return unifiedTimeEntryService.saveEntriesToStorage(entriesToSave);
};

// Direct deletion of an entry - updates both the entries and the deleted list
export const deleteEntryFromStorage = (entryId: string): boolean => {
  return unifiedTimeEntryService.deleteEntryFromStorage(entryId);
};
