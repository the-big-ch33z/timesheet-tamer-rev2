
/**
 * Unified Time Entry Service
 * 
 * This file provides a centralized service for all time entry operations.
 */
import { UnifiedTimeEntryService } from "./unified-service-class";
import { EventManager } from "./event-handling";

// Storage key constants
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Export storage write lock for concurrency control
export const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null
};

// Export the UnifiedTimeEntryService class (this was missing)
export { UnifiedTimeEntryService };

// Export types from the types file
export * from './types';

// Create and export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Initialize the service if we're in browser environment
if (typeof window !== 'undefined') {
  unifiedTimeEntryService.init();
}

// Export validation functions for backward compatibility
export { validateTimeEntry, autoCalculateHours, calculateTotalHours } from './entry-validation';
