
/**
 * Time services index
 * Exports the unified time entry service and its constants
 */
import { 
  timeEntryService,
  unifiedTimeEntryService,
  TimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
} from './time-entry-service';

// Re-export everything for backward compatibility
export { 
  timeEntryService,
  unifiedTimeEntryService,
  TimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
};

// Export singleton instance as default
export default timeEntryService;

// Export type definitions for convenience
export type {
  TimeEntryServiceConfig
} from './types';
