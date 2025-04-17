
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */

// Export the singleton instance as the default export
export { unifiedTimeEntryService as default } from './api-wrapper';

// Export component modules for direct access
export * from './cache-management';
export * from './event-handling';
export * from './storage-operations';
export * from './entry-validation';
export * from './query-operations';
export * from './api-wrapper';

// Export only specific items from core to avoid ambiguity
export { 
  UnifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY
} from './core';

// Export common constants for backward compatibility
export { 
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY, 
  storageWriteLock 
} from './storage-operations';
