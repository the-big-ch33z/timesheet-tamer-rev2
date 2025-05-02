
/**
 * This file provides compatibility with existing code that imports from api-wrapper
 */

import { 
  unifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY,
  UnifiedTimeEntryService
} from './index-unified';

// Re-export for backward compatibility
export { 
  unifiedTimeEntryService,
  createTimeEntryService,
  UnifiedTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY
};

// Backward compatibility for old imports
export const timeEntryService = unifiedTimeEntryService;

// Safe initialization function with retry logic
export const initializeService = async (): Promise<void> => {
  try {
    // Our new service auto-initializes, this is just a no-op for compatibility
    return Promise.resolve();
  } catch (error) {
    // Maintain API compatibility
    return Promise.reject(error);
  }
};
