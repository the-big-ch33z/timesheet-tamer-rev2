
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */
import { 
  unifiedTimeEntryService,
  timeEntryService,
  UnifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
} from './index-unified';

// Export the singleton instance as the default export
export { unifiedTimeEntryService as default };

// Export for backward compatibility
export { 
  unifiedTimeEntryService,
  timeEntryService,
  createTimeEntryService,
  UnifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
};

// Export type definitions
export type {
  TimeEntryEvent,
  TimeEntryEventType,
  ValidationResult,
  TimeEntryServiceConfig
} from './unified-service';
