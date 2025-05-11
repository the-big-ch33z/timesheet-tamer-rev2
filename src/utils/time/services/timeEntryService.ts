
/**
 * @deprecated This file is provided for backward compatibility.
 * Please use time-entry-service.ts instead.
 */

import { 
  timeEntryService,
  unifiedTimeEntryService,
  TimeEntryService,
  createTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY
} from './time-entry-service';

// Re-export the storage key constants for compatibility
export { STORAGE_KEY, DELETED_ENTRIES_KEY };

// Create a compatibility layer for legacy code
export { timeEntryService, unifiedTimeEntryService, TimeEntryService, createTimeEntryService };

// Exports for tests and legacy code
export default timeEntryService;
