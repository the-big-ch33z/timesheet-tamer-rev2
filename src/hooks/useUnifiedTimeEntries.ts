
/**
 * @file Re-export of useUnifiedTimeEntries hook from the timeEntries directory
 */

// Re-export everything from the refactored implementation
export { useUnifiedTimeEntries } from './timeEntries/useUnifiedTimeEntries';
export type { 
  UseUnifiedTimeEntriesOptions,
  UnifiedTimeEntriesResult
} from './timeEntries/types';
