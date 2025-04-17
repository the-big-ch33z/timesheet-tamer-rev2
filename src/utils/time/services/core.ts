
/**
 * @file Re-exports from the time entry service implementation
 * This file maintains the original API while delegating to the new, more modular structure
 */

// Export everything from the time entry service
export * from './time-entry-service';

// Re-export the service constants for backward compatibility
export { STORAGE_KEY, DELETED_ENTRIES_KEY } from './storage-operations';
export { storageWriteLock } from './storage-operations';
export type { TimeEntryEvent, TimeEntryEventType } from './types';

// Export the singleton instance from api-wrapper
export { unifiedTimeEntryService, createTimeEntryService } from './api-wrapper';
