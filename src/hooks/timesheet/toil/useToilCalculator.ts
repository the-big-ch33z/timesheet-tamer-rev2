
import { useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { toilService } from '@/utils/time/services/toil';
import { UseTOILCalculatorProps, UseTOILCalculatorResult } from './types';
import { useToilEntryChecker } from './useTOILEntryChecker';

/**
 * Hook to calculate TOIL for a specific day
 */
export const useToilCalculator = ({
  userId,
  date,
  entries,
  workSchedule,
  isCalculating,
  setIsCalculating,
  setToilSummary
}: UseTOILCalculatorProps): UseTOILCalculatorResult => {
  const logger = useLogger('TOILCalculator');
  const { isToilEntry } = useToilEntryChecker();
  
  // Use refs to prevent unnecessary calculations and track calculation state
  const entriesRef = useRef<typeof entries>([]);
  const isMountedRef = useRef(true);
  
  // Debounced calculator for TOIL updates
  const calculateToilForDay = useCallback(async () => {
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
        []  // Empty array for holidays - they'll be fetched in the service
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
  }, [userId, date, entries, workSchedule, logger, isToilEntry, setIsCalculating, setToilSummary]);

  // Cleanup function for when the component unmounts
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  return { calculateToilForDay };
};
