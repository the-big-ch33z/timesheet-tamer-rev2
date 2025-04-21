
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
      
      // Get count of TOIL usage entries for debugging
      const toilUsageEntries = entries.filter(isToilEntry);
      const nonToilEntries = entries.filter(entry => !isToilEntry(entry));
      
      logger.debug(`[TOILCalc] Starting calculation with ${nonToilEntries.length} regular entries and ${toilUsageEntries.length} TOIL usage entries`);
      
      // Store current entries in ref to compare later
      entriesRef.current = [...entries];
      
      // Process TOIL usage entries first
      if (toilUsageEntries.length > 0) {
        logger.debug(`[TOILCalc] Processing ${toilUsageEntries.length} TOIL usage entries`);
        
        // Process each TOIL usage entry
        for (const entry of toilUsageEntries) {
          logger.debug(`[TOILCalc] Recording TOIL usage for entry ${entry.id}: ${entry.hours}h`);
          const result = await toilService.recordTOILUsage(entry);
          logger.debug(`[TOILCalc] TOIL usage recording ${result ? 'succeeded' : 'failed'}`);
        }
      }
      
      // Calculate and store TOIL accrual
      logger.debug(`[TOILCalc] Calculating TOIL accrual with ${nonToilEntries.length} entries`);
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule
      );
      
      // Update internal state
      setToilSummary(summary);
      
      // Calculation complete
      calculationInProgressRef.current = false;
      
      return summary;
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
        
        // Check if any entries are TOIL usage entries
        const hasToilUsage = entries.some(isToilEntry);
        
        // If we have any TOIL entries, prioritize calculation
        if (hasToilUsage) {
          logger.debug('[TOILCalc] TOIL usage entries detected, calculating immediately');
          calculateToilForDay();
        } else {
          // Schedule TOIL calculation for the next frame to prevent UI blocking
          if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
              // Using setTimeout to further defer heavy calculation
              setTimeout(() => {
                calculateToilForDay();
              }, 100);
            });
          }
        }
      } catch (error) {
        logger.error('Error loading TOIL summary:', error);
      }
    };
    
    loadSummary();
    
  }, [userId, date, currentMonthYear, calculateToilForDay, entriesSignature, toilSummary, logger, isToilEntry, entries]);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay
  };
};
