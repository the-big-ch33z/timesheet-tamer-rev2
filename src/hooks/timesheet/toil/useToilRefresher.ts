import { useEffect, useRef } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';

/**
 * Hook to handle automatic TOIL calculation refreshing
 * Improved to avoid unnecessary calculations when navigating between dates
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
  const processedDatesRef = useRef<Set<string>>(new Set());
  
  // Track entries hash to detect real changes
  const entriesHashRef = useRef<string>("");
  
  // Helper to generate a simple hash of entries to detect changes
  const getEntriesHash = (entries: TimeEntry[]): string => {
    if (!entries || entries.length === 0) return "empty";
    return entries.map(e => `${e.id}-${e.hours}`).join("|");
  };
  
  // Debounce TOIL calculation when entries change
  useEffect(() => {
    if (!userId || !date || !calculateToilForDay) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const currentHash = getEntriesHash(entries || []);
    const dateChanged = dateKey !== prevDateRef.current;
    const entriesChanged = currentHash !== entriesHashRef.current;
    
    prevDateRef.current = dateKey;
    entriesHashRef.current = currentHash;
    
    // No calculation needed if we've already processed this date and entries haven't changed
    if (processedDatesRef.current.has(dateKey) && !entriesChanged) {
      logger.debug(`Already processed TOIL for ${dateKey} and entries unchanged, skipping calculation`);
      return;
    }
    
    logger.debug(
      `${dateChanged ? 'Date changed' : (entriesChanged ? 'Entries changed' : 'Triggered')} ` +
      `(${entries?.length ?? 0} entries), debouncing TOIL calculation`
    );
    
    // Clear any existing timeout
    if (calculationRequestRef.current) {
      clearTimeout(calculationRequestRef.current);
      calculationRequestRef.current = null;
    }
    
    // If date changed, this requires immediate calculation
    if (dateChanged) {
      logger.debug('Date changed, will calculate TOIL immediately');
    }
    
    // If no entries, no need for calculation
    if (!entries || entries.length === 0) {
      logger.debug('No entries, no need to calculate TOIL');
      return;
    }
    
    // Setup debounced calculation
    const timeout = dateChanged ? 100 : 500; // Shorter delay when date changes
    
    calculationRequestRef.current = setTimeout(() => {
      logger.debug('Debounce time elapsed, calculating TOIL');
      calculateToilForDay().then(() => {
        // Mark this date as processed
        processedDatesRef.current.add(dateKey);
        logger.debug(`Marked ${dateKey} as processed for TOIL calculation`);
        
        // Keep the set size manageable
        if (processedDatesRef.current.size > 50) {
          // Remove oldest entries - convert to array for easier manipulation
          const oldestEntries = Array.from(processedDatesRef.current).slice(0, 20);
          oldestEntries.forEach(key => processedDatesRef.current.delete(key));
        }
      }).catch(error => {
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
