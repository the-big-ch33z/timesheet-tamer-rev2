import { useEffect, useRef } from 'react';
import { 
  UseUnifiedTimeEntriesOptions, 
  UnifiedTimeEntriesResult 
} from './types';
import { useTimeEntriesState } from './useTimeEntriesState';
import { useTimeEntriesActions } from './useTimeEntriesActions';
import { useTimeEntriesQueries } from './useTimeEntriesQueries';
import { useTimeEntriesEvents } from './useTimeEntriesEvents';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useUnifiedTimeEntries');

/**
 * Unified hook for using time entries.
 * Provides reactive access to time entries with automatic updates.
 */
export const useUnifiedTimeEntries = (
  options: UseUnifiedTimeEntriesOptions = {}
): UnifiedTimeEntriesResult => {
  // Keep track of mounted state
  const isMountedRef = useRef(true);
  
  // Set up state management
  const [state, setEntries, loadEntries] = useTimeEntriesState(options);
  
  // Set up actions
  const actions = useTimeEntriesActions(options, loadEntries);
  
  // Set up queries
  const queries = useTimeEntriesQueries(state.entries, options);
  
  // Set up event handling
  useTimeEntriesEvents(options, loadEntries);
  
  // Initial load
  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;
    
    // Initial load
    loadEntries();
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, [loadEntries]);
  
  return {
    ...state,
    ...actions,
    ...queries
  };
};
