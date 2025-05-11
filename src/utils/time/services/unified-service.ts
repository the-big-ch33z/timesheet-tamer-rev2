
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

// Export the UnifiedTimeEntryService class
export { UnifiedTimeEntryService };

// Export types from the types file
export * from './types';

// Create and export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Create and export compatability service for backward compatibility
export const timeEntryService = unifiedTimeEntryService;

// Factory function to create a new service instance (for tests or isolated usage)
export function createTimeEntryService(config?: any): UnifiedTimeEntryService {
  return new UnifiedTimeEntryService(config);
}

// Initialize the service if we're in browser environment
if (typeof window !== 'undefined') {
  unifiedTimeEntryService.init();
}

// Export validation functions for backward compatibility
export { validateTimeEntry, autoCalculateHours, calculateTotalHours } from './entry-validation';
