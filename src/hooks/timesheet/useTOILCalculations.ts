import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { toilService, TOIL_JOB_NUMBER } from '@/utils/time/services/toil-service';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { getHolidays } from '@/lib/holidays';

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
  
  // Get holidays from the lib
  const holidays = getHolidays();
  
  // Use refs to prevent unnecessary calculations
  const entriesRef = useRef<TimeEntry[]>([]);
  const calculationInProgressRef = useRef<boolean>(false);
  
  // Get the current month-year string
  const currentMonthYear = format(date, 'yyyy-MM');
  
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);
  
  // Calculate TOIL immediately when entries change
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
      
      // Track that we're calculating
      calculationInProgressRef.current = true;
      
      // Store current entries in ref to compare later
      entriesRef.current = [...entries];
      
      // Process TOIL usage entries first
      const toilUsageEntries = entries.filter(isToilEntry);
      const nonToilEntries = entries.filter(entry => !isToilEntry(entry));
      
      logger.debug(`[TOILCalc] Starting calculation with ${nonToilEntries.length} regular entries and ${toilUsageEntries.length} TOIL usage entries`);
      
      // Process each TOIL usage entry
      for (const entry of toilUsageEntries) {
        const result = await toilService.recordTOILUsage(entry);
        logger.debug(`[TOILCalc] TOIL usage recording ${result ? 'succeeded' : 'failed'} for ${entry.hours}h`);
      }
      
      // Calculate and store TOIL accrual with holidays
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule,
        holidays
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
  }, [userId, date, entries, workSchedule, isToilEntry, currentMonthYear, toilSummary, logger, holidays]);
  
  // Calculate TOIL whenever entries change
  useEffect(() => {
    if (!userId || !date || !entries.length) return;
    
    calculateToilForDay();
  }, [userId, date, entries, calculateToilForDay]);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay
  };
};
