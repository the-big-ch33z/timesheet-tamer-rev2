
/**
 * Unified service exports
 * This file provides a streamlined API for time entry services
 */

import { 
  UnifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from './unified-service';

// Create and export a singleton instance 
export const unifiedTimeEntryService = new UnifiedTimeEntryService({
  enableCaching: true,
  validateOnAccess: false,
  enableAuditing: true
});

// Export for backward compatibility
export const timeEntryService = unifiedTimeEntryService;

// Re-export all types and constants for backward compatibility
export { 
  UnifiedTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY,
  storageWriteLock
} from './unified-service';

// Factory function to create a new service instance (for tests or isolated usage)
export function createTimeEntryService(config?: any): UnifiedTimeEntryService {
  return new UnifiedTimeEntryService(config);
}

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
