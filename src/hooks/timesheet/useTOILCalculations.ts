
import { useState, useEffect, useCallback } from 'react';
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
  
  // Get the current month-year string
  const currentMonthYear = format(date, 'yyyy-MM');
  
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);
  
  // Calculate TOIL for a specific day based on timesheet entries
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      if (!userId || !date || !workSchedule) {
        logger.debug('Missing required data for TOIL calculation');
        return null;
      }
      
      // Filter out TOIL usage entries from accrual calculation
      const accrualEntries = entries.filter(entry => !isToilEntry(entry));
      
      // Calculate and store TOIL
      const summary = await toilService.calculateAndStoreTOIL(
        accrualEntries,
        date,
        userId,
        workSchedule
      );
      
      // Process any TOIL usage entries
      const toilUsageEntries = entries.filter(isToilEntry);
      for (const entry of toilUsageEntries) {
        await toilService.recordTOILUsage(entry);
      }
      
      // Get updated summary after recording usage
      const updatedSummary = toilUsageEntries.length > 0 
        ? toilService.getTOILSummary(userId, currentMonthYear)
        : summary;
      
      setToilSummary(updatedSummary);
      return updatedSummary;
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      return null;
    }
  }, [userId, date, entries, workSchedule, isToilEntry, currentMonthYear, logger]);
  
  // Load or calculate TOIL summary when dependencies change
  useEffect(() => {
    const loadSummary = async () => {
      try {
        // Get current summary from storage first
        const storedSummary = toilService.getTOILSummary(userId, currentMonthYear);
        
        if (storedSummary) {
          setToilSummary(storedSummary);
        }
        
        // Then calculate to ensure it's up to date
        await calculateToilForDay();
      } catch (error) {
        logger.error('Error loading TOIL summary:', error);
      }
    };
    
    if (userId && date) {
      loadSummary();
    }
  }, [userId, date, currentMonthYear, calculateToilForDay, logger]);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay
  };
};
