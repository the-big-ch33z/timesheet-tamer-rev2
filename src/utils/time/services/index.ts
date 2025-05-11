
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */
import { 
  timeEntryService,
  unifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours,
  storageWriteLock
} from './time-entry-service';

// Re-export everything for backward compatibility
export { 
  timeEntryService,
  unifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours,
  storageWriteLock
};

// Re-export types for convenience
export type {
  TimeEntryEvent,
  TimeEntryServiceConfig,
  TimeEntryEventType
} from './types';

// Export singleton instance as default
export default timeEntryService;
