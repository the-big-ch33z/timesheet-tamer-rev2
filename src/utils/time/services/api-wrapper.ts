
/**
 * This file provides compatibility with existing code that imports from api-wrapper
 */

import { 
  timeEntryService,
  unifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY,
  TimeEntryService
} from './time-entry-service';

// Re-export for backward compatibility
export { 
  unifiedTimeEntryService,
  timeEntryService,
  createTimeEntryService,
  TimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY
};

// Safe initialization function with retry logic
export const initializeService = async (): Promise<void> => {
  try {
    // Our service auto-initializes, this is just a no-op for compatibility
    return Promise.resolve();
  } catch (error) {
    // Maintain API compatibility
    return Promise.reject(error);
  }
};
