
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
  
  // Log schedule information when it changes for debugging
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        weekPattern: workSchedule.weekPattern
      });
    } else {
      logger.warn(`No work schedule provided for user ${userId} - TOIL calculation may be incorrect`);
    }
  }, [workSchedule, userId, logger]);
  
  // Clear caches when month changes
  useEffect(() => {
    logger.debug(`Month changed to ${currentMonthYear}, clearing TOIL cache`);
    toilService.clearCache();
  }, [currentMonthYear, logger]);
  
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);
  
  // Initialize TOIL summary when component mounts or user/date changes
  useEffect(() => {
    if (!userId || !date) return;
    
    const fetchInitialSummary = async () => {
      try {
        logger.debug(`Fetching initial TOIL summary for ${userId}, ${format(date, 'yyyy-MM')}`);
        const summary = toilService.getTOILSummary(userId, format(date, 'yyyy-MM'));
        
        if (isMountedRef.current) {
          logger.debug(`Setting initial TOIL summary:`, summary);
          setToilSummary(summary);
        }
      } catch (error) {
        logger.error('Error fetching initial TOIL summary:', error);
      }
    };
    
    fetchInitialSummary();
  }, [userId, date, logger]);
  
  // Debounced calculator for TOIL updates
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      // Set calculating state at the beginning
      if (isMountedRef.current) {
        setIsCalculating(true);
      }
      
      logger.debug(`calculateToilForDay called for date ${format(date, 'yyyy-MM-dd')}`);
      
      // Return early if missing required data or component unmounted
      if (!userId || !date || !isMountedRef.current) {
        logger.debug('Missing required data for TOIL calculation or component unmounted', {
          hasUserId: !!userId,
          hasDate: !!date,
          hasWorkSchedule: !!workSchedule,
          isMounted: isMountedRef.current
        });
        
        if (isMountedRef.current) {
          setIsCalculating(false);
        }
        
        return null;
      }
      
      // Check for missing work schedule - this is critical
      if (!workSchedule) {
        logger.warn(`Missing work schedule for user ${userId} - TOIL calculation will use default schedule`);
        // Continue with calculation - the toilService will use default schedule
      } else {
        logger.debug(`Using schedule "${workSchedule.name}" (${workSchedule.id}) for TOIL calculation`);
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
          setIsCalculating(false);
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
      
      logger.debug(`Found ${toilUsageEntries.length} TOIL usage entries and ${nonToilEntries.length} regular entries`);
      
      // Process each TOIL usage entry
      for (const entry of toilUsageEntries) {
        logger.debug(`Processing TOIL usage entry: ${entry.id}, hours: ${entry.hours}`);
        await toilService.recordTOILUsage(entry);
      }
      
      // Calculate and store TOIL accrual with holidays - this uses the optimized service
      logger.debug(`Calculating TOIL accrual for ${nonToilEntries.length} entries`);
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule,
        holidays
      );
      
      logger.debug(`TOIL summary after calculation:`, summary);
      
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
    
    // If no entries, set zero summary immediately
    if (!entries || entries.length === 0) {
      logger.debug('No entries, setting zero TOIL summary');
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
        logger.debug('Debounce time elapsed, calculating TOIL');
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
      logger.debug('TOIL calculations hook unmounting');
      isMountedRef.current = false;
      if (calculationRequestRef.current) {
        clearTimeout(calculationRequestRef.current);
      }
    };
  }, [logger]);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay,
    isCalculating
  };
};
