
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */

export * from './unifiedTimeEntryService';

// Export common constants for backward compatibility
export { STORAGE_KEY, DELETED_ENTRIES_KEY, storageWriteLock } from './unifiedTimeEntryService';
