
import { useEffect, useRef } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';

/**
 * Hook to handle automatic TOIL calculation refreshing
 */
export const useToilRefresher = (
  userId: string,
  date: Date,
  entries: TimeEntry[],
  workSchedule?: WorkSchedule,
  calculateToilForDay?: () => Promise<any>
) => {
  const logger = useLogger('TOILRefresher');
  const calculationRequestRef = useRef<NodeJS.Timeout | null>(null);
  const prevDateRef = useRef<string>("");
  
  // Debounce TOIL calculation when entries change
  useEffect(() => {
    if (!userId || !date || !calculateToilForDay) return;
    
    logger.debug(`Entries changed (${entries?.length ?? 0} entries), debouncing TOIL calculation`);
    
    // Clear any existing timeout
    if (calculationRequestRef.current) {
      clearTimeout(calculationRequestRef.current);
      calculationRequestRef.current = null;
    }
    
    // Check if date changed - this requires immediate calculation
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateChanged = dateKey !== prevDateRef.current;
    prevDateRef.current = dateKey;
    
    if (dateChanged) {
      logger.debug('Date changed, will calculate TOIL immediately');
    }
    
    // If no entries, set zero summary immediately and return
    if (!entries || entries.length === 0) {
      logger.debug('No entries, no need to calculate TOIL');
      return;
    }
    
    // Setup debounced calculation
    const timeout = dateChanged ? 100 : 500; // Shorter delay when date changes
    
    calculationRequestRef.current = setTimeout(() => {
      logger.debug('Debounce time elapsed, calculating TOIL');
      calculateToilForDay().catch(error => {
        logger.error('Calculation request failed:', error);
      });
      calculationRequestRef.current = null;
    }, timeout);
    
    return () => {
      if (calculationRequestRef.current) {
        clearTimeout(calculationRequestRef.current);
        calculationRequestRef.current = null;
      }
    };
  }, [userId, date, entries, calculateToilForDay, logger]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug('TOIL refresher hook unmounting');
      if (calculationRequestRef.current) {
        clearTimeout(calculationRequestRef.current);
      }
    };
  }, [logger]);
};
