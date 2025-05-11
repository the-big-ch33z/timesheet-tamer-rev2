
/**
 * Time services index
 * Central export point for all time-related service functions
 * 
 * This module provides a unified interface to time services
 * while maintaining backward compatibility.
 */

// Export the unified service as the main interface
export { unifiedTimeEntryService } from './unified-service';

// Export service class for advanced usage
export { UnifiedTimeEntryService } from './unified-service';

// Re-export types for external consumption
export type {
  TimeEntryEvent,
  TimeEntryEventType,
  ValidationResult,
  TimeEntryServiceConfig
} from './unified-service';

// Export storage constants
export { 
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from './unified-service';

// Export utility functions
export {
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
} from './unified-service';

// Export legacy services for backward compatibility
// These will be deprecated in future versions
export { timeEntryService, createTimeEntryService } from './unified-service';

// Add deprecation notices using console warnings in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Some time service exports are deprecated and will be removed in a future version.\n' +
    'Please use unifiedTimeEntryService instead of timeEntryService.\n' +
    'See documentation for migration guidance.'
  );
}
