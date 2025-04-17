import { useState, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { UnifiedTimeEntriesState, UseUnifiedTimeEntriesOptions } from './types';

const logger = createTimeLogger('useTimeEntriesState');

/**
 * Hook to manage the state of time entries
 */
export const useTimeEntriesState = (options: UseUnifiedTimeEntriesOptions = {}): 
  [UnifiedTimeEntriesState, React.Dispatch<React.SetStateAction<TimeEntry[]>>, () => void] => {
  
  const { userId, date } = options;
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Load entries based on the options
  const loadEntries = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let loadedEntries: TimeEntry[] = [];
      
      if (date && userId) {
        // Get entries for a specific day and user
        loadedEntries = unifiedTimeEntryService.getDayEntries(date, userId);
        logger.debug(`Loaded ${loadedEntries.length} entries for user ${userId} on ${date.toDateString()}`);
      } else if (userId) {
        // Get all entries for a user
        loadedEntries = unifiedTimeEntryService.getUserEntries(userId);
        logger.debug(`Loaded ${loadedEntries.length} entries for user ${userId}`);
      } else {
        // Get all entries
        loadedEntries = unifiedTimeEntryService.getAllEntries();
        logger.debug(`Loaded ${loadedEntries.length} entries`);
      }
      
      if (isMountedRef.current) {
        setEntries(loadedEntries);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error loading entries';
      logger.error('Error loading entries:', errorMessage);
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, date]);

  return [
    { entries, isLoading, error },
    setEntries,
    loadEntries
  ];
};
