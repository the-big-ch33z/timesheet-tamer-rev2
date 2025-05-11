
/**
 * Unified service exports
 * This file provides a streamlined API for time entry services
 * @deprecated Use imports from time-entry-service.ts directly
 */

// Re-export everything from the consolidated service
export * from './time-entry-service';

// Export singleton instance as default for backward compatibility
export { timeEntryService as default } from './time-entry-service';
