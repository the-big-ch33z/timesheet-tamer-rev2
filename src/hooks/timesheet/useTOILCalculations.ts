
import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { toilService, TOIL_JOB_NUMBER } from '@/utils/time/services/toil-service';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';

export interface UseTOILCalculationsProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
}

export interface UseTOILCalculationsResult {
  toilSummary: TOILSummary | null;
  isToilEntry: (entry: TimeEntry) => boolean;
  calculateToilForDay: () => Promise<TOILSummary | null>;
}

export const useTOILCalculations = ({
  userId,
  date,
  entries,
  workSchedule
}: UseTOILCalculationsProps): UseTOILCalculationsResult => {
  const logger = useLogger('TOILCalculations');
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(null);
  
  // Use refs to prevent unnecessary calculations
  const entriesRef = useRef<TimeEntry[]>([]);
  const calculationInProgressRef = useRef<boolean>(false);
  const lastCalculationTimeRef = useRef<number>(0);
  
  // Get the current month-year string
  const currentMonthYear = format(date, 'yyyy-MM');
  
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);
  
  // Debounced calculation function to prevent excessive calculations
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      // Return early if missing required data
      if (!userId || !date || !workSchedule) {
        logger.debug('Missing required data for TOIL calculation');
        return null;
      }
      
      // Prevent concurrent calculations
      if (calculationInProgressRef.current) {
        logger.debug('TOIL calculation already in progress, skipping');
        return toilSummary;
      }
      
      // Throttle calculations to at most once per second
      const now = Date.now();
      if (now - lastCalculationTimeRef.current < 1000) {
        logger.debug('TOIL calculation throttled, skipping');
        return toilSummary;
      }
      
      // Track that we're calculating
      calculationInProgressRef.current = true;
      lastCalculationTimeRef.current = now;
      
      // Filter out TOIL usage entries from accrual calculation
      const accrualEntries = entries.filter(entry => !isToilEntry(entry));
      
      // Store current entries in ref to compare later
      entriesRef.current = [...entries];
      
      // Calculate and store TOIL
      const summary = await toilService.calculateAndStoreTOIL(
        accrualEntries,
        date,
        userId,
        workSchedule
      );
      
      // Process any TOIL usage entries
      const toilUsageEntries = entries.filter(isToilEntry);
      
      // Use Promise.all for better performance with multiple entries
      if (toilUsageEntries.length > 0) {
        await Promise.all(toilUsageEntries.map(entry => toilService.recordTOILUsage(entry)));
      }
      
      // Get updated summary after recording usage
      const updatedSummary = toilUsageEntries.length > 0 
        ? toilService.getTOILSummary(userId, currentMonthYear)
        : summary;
      
      setToilSummary(updatedSummary);
      
      // Calculation complete
      calculationInProgressRef.current = false;
      
      return updatedSummary;
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      calculationInProgressRef.current = false;
      return null;
    }
  }, [userId, date, entries, workSchedule, isToilEntry, currentMonthYear, toilSummary, logger]);
  
  // Memoize entries to detect changes
  const entriesSignature = entries.map(e => e.id).join(',');
  
  // Load or calculate TOIL summary when dependencies change
  useEffect(() => {
    // Skip if we're missing critical data
    if (!userId || !date) return;
    
    // Skip if entries haven't changed
    const previousEntriesSignature = entriesRef.current.map(e => e.id).join(',');
    if (previousEntriesSignature === entriesSignature && toilSummary) {
      return;
    }
    
    const loadSummary = async () => {
      try {
        // Get current summary from storage first - this is very fast
        const storedSummary = toilService.getTOILSummary(userId, currentMonthYear);
        
        if (storedSummary) {
          setToilSummary(storedSummary);
        }
        
        // Schedule TOIL calculation for the next frame to prevent UI blocking
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            // Using setTimeout to further defer heavy calculation
            setTimeout(() => {
              calculateToilForDay();
            }, 100);
          });
        }
      } catch (error) {
        logger.error('Error loading TOIL summary:', error);
      }
    };
    
    loadSummary();
    
    // Clean up on unmount or when dependencies change
    return () => {
      // No need for cleanup as we're using refs for state
    };
  }, [userId, date, currentMonthYear, calculateToilForDay, entriesSignature, toilSummary, logger]);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay
  };
};
