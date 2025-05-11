
/**
 * Time Entry Context Module
 * 
 * This module provides a unified context for managing time entries.
 * It serves as the main entry point for the time entry functionality.
 */

// Export the main context and hook
export { 
  TimeEntryContext, 
  TimeEntryProvider, 
  useTimeEntryContext,
  type TimeEntryProviderProps
} from './TimeEntryContext';

// Re-export EntriesContext for backward compatibility
export { EntriesContext, useEntriesContext } from './EntriesContext';

// Export types for consumers
export * from './types';
