
import React, { useCallback, useRef } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { TOILSummary } from '@/types/toil';
import { parseISO, format } from 'date-fns';
import { toilService } from '@/utils/time/services/toil';
import { getHolidays } from '@/lib/holidays';
import { TOIL_JOB_NUMBER } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { 
  groupEntriesByDate, 
  validateCalculationData, 
  RateLimiter 
} from '../utils/toilCalculationUtils';
import {
  dispatchCalculationStart,
  dispatchCalculationComplete,
  dispatchCalculationError
} from '../utils/toilEventUtils';

const logger = createTimeLogger('useToilCalculation');

export interface UseToilCalculationProps {
  userId: string;
  date: Date;
  monthYear: string;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  monthOnly?: boolean;
  setIsCalculating: (calculating: boolean) => void;
  setToilSummary: (summary: TOILSummary | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isTestMode?: boolean;
}

export interface UseToilCalculationResult {
  calculateToilForDay: () => Promise<TOILSummary | null>;
  triggerTOILCalculation: () => Promise<TOILSummary | null>;
  isToilEntry: (entry: TimeEntry) => boolean;
}

/**
 * Hook for managing TOIL calculations
 */
export function useToilCalculation({
  userId,
  date,
  monthYear,
  entries,
  workSchedule,
  monthOnly = false,
  setIsCalculating,
  setToilSummary,
  setIsLoading,
  setError,
  isTestMode = false
}: UseToilCalculationProps): UseToilCalculationResult {
  const isMountedRef = useRef(true);
  const calculationInProgressRef = useRef(false);
  const rateLimiter = useRef(new RateLimiter(150));
  const holidays = getHolidays();

  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);

  // Process TOIL for a single date
  const processSingleDate = useCallback(async (
    dateKey: string, 
    dayEntries: TimeEntry[]
  ): Promise<void> => {
    const entryDate = parseISO(dateKey);
    logger.debug(`Processing TOIL for date ${dateKey} with ${dayEntries.length} entries`);

    // Process TOIL usage entries first
    const toilUsageEntries = dayEntries.filter(isToilEntry);
    const nonToilEntries = dayEntries.filter(entry => !isToilEntry(entry));
    
    // Process each TOIL usage entry
    for (const entry of toilUsageEntries) {
      logger.debug(`Processing TOIL usage entry: ${entry.id}, hours: ${entry.hours}`);
      await toilService.recordTOILUsage(entry);
    }
    
    // Calculate and store TOIL accrual for non-TOIL entries
    if (nonToilEntries.length > 0) {
      logger.debug(`Calculating TOIL accrual for ${nonToilEntries.length} entries on ${dateKey}`);
      await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        entryDate,
        userId,
        workSchedule,
        holidays
      );
    }
  }, [isToilEntry, userId, workSchedule, holidays]);

  // Main calculation function
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    if (isTestMode) return null;

    try {
      if (!isMountedRef.current || calculationInProgressRef.current) {
        return null;
      }
      
      setIsCalculating(true);
      
      if (!rateLimiter.current.canProceed()) {
        logger.debug('Skipping TOIL calculation due to rate limiting');
        return null;
      }
      
      calculationInProgressRef.current = true;
      
      if (!validateCalculationData(userId, date, entries)) {
        if (isMountedRef.current) setIsCalculating(false);
        calculationInProgressRef.current = false;
        return null;
      }

      if (monthOnly) {
        // Process all entries for the month, grouped by date
        logger.debug(`Processing TOIL for entire month with ${entries.length} entries`);
        
        if (entries.length === 0) {
          logger.debug('No entries to process for the month');
          if (isMountedRef.current) setIsCalculating(false);
          calculationInProgressRef.current = false;
          return toilService.getTOILSummary(userId, monthYear);
        }

        // Group entries by date and process each date
        const entriesByDate = groupEntriesByDate(entries);
        const processedDates: string[] = [];

        for (const [dateKey, dayEntries] of Object.entries(entriesByDate)) {
          try {
            await processSingleDate(dateKey, dayEntries);
            processedDates.push(dateKey);
          } catch (error) {
            logger.error(`Error processing TOIL for date ${dateKey}:`, error);
          }
        }

        logger.debug(`Processed TOIL for ${processedDates.length} dates: ${processedDates.join(', ')}`);
      } else {
        // Single day processing
        logger.debug(`calculateToilForDay called for date ${format(date, 'yyyy-MM-dd')} with ${entries.length} entries`);
        
        if (!date || entries.length === 0) {
          logger.debug('Missing required data for single day TOIL calculation');
          if (isMountedRef.current) setIsCalculating(false);
          calculationInProgressRef.current = false;
          return null;
        }
        
        await processSingleDate(format(date, 'yyyy-MM-dd'), entries);
      }
      
      // Get updated summary after all processing
      const summary = toilService.getTOILSummary(userId, monthYear);
      logger.debug(`TOIL summary after calculation:`, summary);
      
      // Ensure the monthYear field is set
      if (summary && !summary.monthYear) {
        summary.monthYear = monthYear;
      }
      
      // Update internal state if component still mounted
      if (isMountedRef.current) {
        setToilSummary(summary);
        setIsLoading(false);
      }
      
      return summary;
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : String(error));
        setIsLoading(false);
      }
      
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsCalculating(false);
      }
      calculationInProgressRef.current = false;
    }
  }, [
    userId, date, entries, workSchedule, monthYear, monthOnly, holidays,
    setIsCalculating, setToilSummary, setIsLoading, setError, processSingleDate, isTestMode
  ]);

  // Trigger calculation with improved event handling
  const triggerTOILCalculation = useCallback(async (): Promise<TOILSummary | null> => {
    if (isTestMode) return null;

    logger.debug('Manually triggering TOIL calculation');
    
    try {
      dispatchCalculationStart(userId, date, monthYear);
      
      const result = await calculateToilForDay();
      
      dispatchCalculationComplete(userId, date, monthYear, result);
      
      logger.debug('Manual TOIL calculation complete');
      return result;
    } catch (error) {
      logger.error('Error during manual TOIL calculation:', error);
      
      dispatchCalculationError(userId, date, monthYear, error);
      
      if (isMountedRef.current) {
        setIsLoading(false);
        setError(error instanceof Error ? error.message : String(error));
      }
      
      throw error;
    }
  }, [calculateToilForDay, userId, date, monthYear, setIsLoading, setError, isTestMode]);

  // Cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    calculateToilForDay,
    triggerTOILCalculation,
    isToilEntry
  };
}
