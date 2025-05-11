
/**
 * @deprecated This file is provided for backward compatibility.
 * Please use unifiedTimeEntryService instead.
 */

import { unifiedTimeEntryService } from './core';

// Re-export the storage key constants for compatibility
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Create a compatibility layer for legacy code
export const timeEntryService = unifiedTimeEntryService;

// For backward compatibility with code using createTimeEntryService
export const createTimeEntryService = () => unifiedTimeEntryService;

// Exports for tests and legacy code
export default timeEntryService;
