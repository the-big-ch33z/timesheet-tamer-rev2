
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */

// Export the singleton instance as the default export
export { unifiedTimeEntryService as default } from './core';

// Export all types and components for convenience
export * from './core';
export * from './cache-management';
export * from './event-handling';
export * from './storage-operations';
export * from './entry-validation';

// Export common constants for backward compatibility
export { 
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY, 
  storageWriteLock 
} from './storage-operations';
