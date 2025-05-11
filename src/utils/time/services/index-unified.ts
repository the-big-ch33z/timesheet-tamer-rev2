
/**
 * Unified service exports
 * This file provides a streamlined API for time entry services
 */

import { 
  unifiedTimeEntryService,
  UnifiedTimeEntryService,
  timeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock,
  validateTimeEntry, 
  autoCalculateHours, 
  calculateTotalHours
} from './unified-service';

// Export for backward compatibility
export { timeEntryService, unifiedTimeEntryService };

// Re-export all types and constants for backward compatibility
export { 
  UnifiedTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY,
  storageWriteLock,
  createTimeEntryService
} from './unified-service';

// Re-export commonly used validation functions
export {
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
} from './unified-service';

// Type exports
export type {
  TimeEntryEvent,
  TimeEntryEventType,
  ValidationResult,
  TimeEntryServiceConfig
} from './unified-service';
