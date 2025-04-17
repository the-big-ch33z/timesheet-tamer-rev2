
import { UnifiedTimeEntryService } from './unified-service-class';
import { TimeEntryServiceConfig } from './types';
import { 
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY 
} from './storage-operations';
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('UnifiedTimeEntryService');

// Export singleton instance
export const timeEntryService = new UnifiedTimeEntryService();

// Initialize the service if we're in browser environment
if (typeof window !== 'undefined') {
  timeEntryService.init();
}

// Re-export for backward compatibility
export { 
  UnifiedTimeEntryService,
  STORAGE_KEY,
  DELETED_ENTRIES_KEY
};

/**
 * Factory function to create a new service instance
 * Useful for tests or isolated usage scenarios
 */
export function createTimeEntryService(config?: TimeEntryServiceConfig): UnifiedTimeEntryService {
  const service = new UnifiedTimeEntryService(config);
  service.init();
  return service;
}
