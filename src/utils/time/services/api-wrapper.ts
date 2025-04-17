
/**
 * This file provides a wrapper around the UnifiedTimeEntryService class
 * to export a singleton instance and consistent API
 */

import { UnifiedTimeEntryService, createTimeEntryService } from './time-entry-service';
import { TimeEntryServiceConfig } from './types';
import { STORAGE_KEY, DELETED_ENTRIES_KEY } from './storage-operations';

// Export all types and constants from the service for backward compatibility
export { 
  UnifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY 
};

// Create and export a singleton instance
export const unifiedTimeEntryService = createTimeEntryService();

/**
 * Deprecated export for backward compatibility
 * @deprecated Use unifiedTimeEntryService instead
 */
export const timeEntryService = unifiedTimeEntryService;
