
import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { toilService, TOIL_JOB_NUMBER } from '@/utils/time/services/toil';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { getHolidays } from '@/lib/holidays';
import { useMemo } from 'react';

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
  isCalculating: boolean;
}

export const useTOILCalculations = ({
  userId,
  date,
  entries,
  workSchedule
}: UseTOILCalculationsProps): UseTOILCalculationsResult => {
  const logger = useLogger('TOILCalculations');
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Memoize holidays to prevent recreation on every render
  const holidays = useMemo(() => getHolidays(), []);
  
  // Use refs to prevent unnecessary calculations and track calculation state
  const entriesRef = useRef<TimeEntry[]>([]);
  const calculationRequestRef = useRef<NodeJS.Timeout | null>(null);
  const prevDateRef = useRef<string>("");
  
  // Track if this is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  
  // Get the current month-year string
  const currentMonthYear = format(date, 'yyyy-MM');
  
  // Clear caches when month changes
  useEffect(() => {
    toilService.clearCache();
  }, [currentMonthYear]);
  
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);
  
  // Debounced calculator for TOIL updates
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      // Set calculating state at the beginning
      if (isMountedRef.current) {
        setIsCalculating(true);
      }
      
      // Return early if missing required data or component unmounted
      if (!userId || !date || !workSchedule || !isMountedRef.current) {
        logger.debug('Missing required data for TOIL calculation or component unmounted');
        return null;
      }
      
      // Return early if no entries
      if (!entries || entries.length === 0) {
        logger.debug('No entries for TOIL calculation, returning zero summary');
        const zeroSummary = {
          userId,
          monthYear: format(date, 'yyyy-MM'),
          accrued: 0,
          used: 0,
          remaining: 0
        };
        
        if (isMountedRef.current) {
          setToilSummary(zeroSummary);
        }
        
        return zeroSummary;
      }
      
      // Store current entries in ref to compare later
      entriesRef.current = [...entries];
      
      // Filter entries for efficiency
      const dateKey = format(date, 'yyyy-MM-dd');
      logger.debug(`[TOILCalc] Processing day ${dateKey} with ${entries.length} entries`);
      
      // Process TOIL usage entries first
      const toilUsageEntries = entries.filter(isToilEntry);
      const nonToilEntries = entries.filter(entry => !isToilEntry(entry));
      
      // Process each TOIL usage entry
      for (const entry of toilUsageEntries) {
        await toilService.recordTOILUsage(entry);
      }
      
      // Calculate and store TOIL accrual with holidays - this uses the optimized service
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule,
        holidays
      );
      
      // Update internal state if component still mounted
      if (isMountedRef.current) {
        setToilSummary(summary);
      }
      
      return summary;
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      return null;
    } finally {
      // Always reset calculating state if component is mounted
      if (isMountedRef.current) {
        setIsCalculating(false);
      }
    }
  }, [userId, date, entries, workSchedule, logger, holidays, isToilEntry]);
  
  // Debounce TOIL calculation when entries change
  useEffect(() => {
    if (!userId || !date) return;
    
    // Clear any existing timeout
    if (calculationRequestRef.current) {
      clearTimeout(calculationRequestRef.current);
      calculationRequestRef.current = null;
    }
    
    // Check if date changed - this requires immediate calculation
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateChanged = dateKey !== prevDateRef.current;
    prevDateRef.current = dateKey;
    
    // If no entries, set zero summary immediately
    if (!entries || entries.length === 0) {
      if (isMountedRef.current) {
        setToilSummary({
          userId,
          monthYear: format(date, 'yyyy-MM'),
          accrued: 0,
          used: 0,
          remaining: 0
        });
      }
      return;
    }
    
    // Setup debounced calculation
    const timeout = dateChanged ? 100 : 500; // Shorter delay when date changes
    
    calculationRequestRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        calculateToilForDay().catch(error => {
          logger.error('Calculation request failed:', error);
          if (isMountedRef.current) {
            setIsCalculating(false); // Ensure we reset state even on error
          }
        });
      }
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
      isMountedRef.current = false;
      if (calculationRequestRef.current) {
        clearTimeout(calculationRequestRef.current);
      }
    };
  }, []);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay,
    isCalculating
  };
};
