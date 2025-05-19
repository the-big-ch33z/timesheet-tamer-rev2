
import { useMemo } from 'react';
import { getHolidays } from '@/lib/holidays';
import { 
  UseTOILCalculationsProps,
  UseTOILCalculationsResult
} from './types';
import { useToilEntryChecker } from './useTOILEntryChecker';
import { useToilState } from './useToilState';
import { useToilCalculator } from './useToilCalculator';
import { useToilCacheClearer } from './useToilCacheClearer';
import { useToilRefresher } from './useToilRefresher';
import { useWorkScheduleLogger } from './useWorkScheduleLogger';

/**
 * Main TOIL calculations hook that composes all the individual TOIL hooks
 */
export const useTOILCalculations = ({
  userId,
  date,
  entries,
  workSchedule
}: UseTOILCalculationsProps): UseTOILCalculationsResult => {
  // Memoize holidays to prevent recreation on every render
  const holidays = useMemo(() => getHolidays(), []);
  
  // Log work schedule information
  useWorkScheduleLogger(workSchedule, userId);
  
  // Clear TOIL caches when month changes
  useToilCacheClearer(date);
  
  // Manage TOIL state
  const {
    toilSummary,
    setToilSummary,
    isCalculating,
    setIsCalculating
  } = useToilState({ userId, date, workSchedule });
  
  // Get TOIL entry checker
  const { isToilEntry } = useToilEntryChecker();
  
  // Get TOIL calculator
  const { calculateToilForDay } = useToilCalculator({
    userId,
    date,
    entries,
    workSchedule,
    isCalculating,
    setIsCalculating,
    setToilSummary
  });
  
  // Handle automatic refreshing
  useToilRefresher(userId, date, entries, workSchedule, calculateToilForDay);
  
  return {
    toilSummary,
    isToilEntry,
    calculateToilForDay,
    isCalculating
  };
};
