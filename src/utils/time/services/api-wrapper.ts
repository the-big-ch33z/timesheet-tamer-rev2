
/**
 * This file provides a wrapper around the UnifiedTimeEntryService class
 * to export a singleton instance and consistent API
 */

import { UnifiedTimeEntryService } from './core';
import { TimeEntryServiceConfig } from './types';

// Export all types and constants from the service for backward compatibility
export * from './core';

// Create and export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();

// Initialize the service
if (typeof window !== 'undefined') {
  unifiedTimeEntryService.init();
}

/**
 * Factory function to create a new service instance
 * Useful for tests or isolated usage scenarios
 */
export function createTimeEntryService(config?: TimeEntryServiceConfig): UnifiedTimeEntryService {
  const service = new UnifiedTimeEntryService(config);
  service.init();
  return service;
}
