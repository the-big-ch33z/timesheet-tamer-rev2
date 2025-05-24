
// Main exports from the refactored unified service
export { 
  UnifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY,
  storageWriteLock,
  validateTimeEntry,
  autoCalculateHours,
  calculateTotalHours
} from './unified-service';

export type { 
  TimeEntryServiceConfig,
  TimeEntryEventType,
  TimeEntryEvent,
  ValidationResult
} from './unified-service';

// Create singleton instance
import { UnifiedTimeEntryService } from './unified-service';

export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Also export as timeEntryService for backward compatibility
export const timeEntryService = unifiedTimeEntryService;

// Factory function
export function createTimeEntryService(config?: any): UnifiedTimeEntryService {
  const service = new UnifiedTimeEntryService(config);
  service.init();
  return service;
}
