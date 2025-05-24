
import { useEffect, useMemo } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { useToilState } from './hooks/useToilState';
import { useToilCache } from './hooks/useToilCache';
import { useToilEvents } from './hooks/useToilEvents';
import { useToilCalculation } from './hooks/useToilCalculation';

// Create a logger for this hook
const logger = createTimeLogger('useUnifiedTOIL');

// OPTIMIZED: More responsive refresh intervals
const DEFAULT_REFRESH_INTERVAL = 3000; // 3 seconds

export interface UseUnifiedTOILProps {
  userId: string;
  date: Date;
  entries?: TimeEntry[];
  workSchedule?: WorkSchedule;
  options?: {
    monthOnly?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
    testProps?: {
      summary: TOILSummary | null;
      loading: boolean;
      testModeEnabled?: boolean;
    };
  };
}

export interface UseUnifiedTOILResult {
  // Common state
  toilSummary: TOILSummary | null;
  isLoading: boolean;
  error: string | null;
  
  // Calculation functionality
  isCalculating: boolean;
  calculateToilForDay: () => Promise<TOILSummary | null>;
  triggerTOILCalculation: () => Promise<TOILSummary | null>;
  
  // Utility functions
  isToilEntry: (entry: TimeEntry) => boolean;
  refreshSummary: () => void;
}

/**
 * Unified TOIL hook that provides comprehensive TOIL functionality
 * REFACTORED: Now uses composition of smaller, focused hooks
 */
export function useUnifiedTOIL({
  userId,
  date,
  entries = [],
  workSchedule,
  options = {}
}: UseUnifiedTOILProps): UseUnifiedTOILResult {
  // Default options
  const { 
    monthOnly = false,
    autoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    testProps
  } = options;

  // Test mode requires both testProps and explicit flag
  const isTestMode = !!(testProps && testProps.testModeEnabled === true);
  const monthYear = useMemo(() => format(date, 'yyyy-MM'), [date]);

  // For test mode, return test values immediately
  if (isTestMode) {
    logger.debug('Test mode enabled, using test props for TOIL data');
    return {
      toilSummary: testProps?.summary || null,
      isLoading: testProps?.loading || false,
      error: null,
      isCalculating: false,
      calculateToilForDay: async () => testProps?.summary || null,
      triggerTOILCalculation: async () => testProps?.summary || null,
      isToilEntry: () => false,
      refreshSummary: () => {}
    };
  }

  // Enhanced work schedule logging
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        userId,
        weeksCount: workSchedule.weeks ? Object.keys(workSchedule.weeks).length : 0,
        rdoDaysCount: workSchedule.rdoDays ? Object.keys(workSchedule.rdoDays).length : 0
      });
    } else {
      logger.warn(`No work schedule provided for user ${userId} - TOIL calculation may be inaccurate`);
    }
  }, [workSchedule, userId]);

  // Use the state management hook
  const {
    toilSummary,
    setToilSummary,
    isLoading,
    setIsLoading,
    error,
    setError,
    isCalculating,
    setIsCalculating
  } = useToilState({
    userId,
    monthYear,
    isTestMode,
    testSummary: testProps?.summary,
    testLoading: testProps?.loading
  });

  // Use the cache management hook
  const { loadSummary, refreshSummary } = useToilCache({
    userId,
    monthYear,
    setToilSummary,
    setIsLoading,
    setError
  });

  // Use the calculation hook
  const {
    calculateToilForDay,
    triggerTOILCalculation,
    isToilEntry
  } = useToilCalculation({
    userId,
    date,
    monthYear,
    entries,
    workSchedule,
    monthOnly,
    setIsCalculating,
    setToilSummary,
    setIsLoading,
    setError,
    isTestMode
  });

  // Use the events hook
  useToilEvents({
    userId,
    monthYear,
    setToilSummary,
    setIsLoading,
    refreshSummary,
    isTestMode
  });

  // Initialize TOIL summary
  useEffect(() => {
    if (!userId || !date) return;
    loadSummary();
  }, [userId, date, loadSummary]);

  // Debounced calculation when entries change
  useEffect(() => {
    if (!userId || !date || !autoRefresh || entries.length === 0) return;
    
    logger.debug(`Entries changed (${entries.length} entries), debouncing TOIL calculation`);
    
    const timeoutId = setTimeout(() => {
      logger.debug('Debounce time elapsed, calculating TOIL');
      calculateToilForDay();
    }, 200); // 200ms for responsive calculations
    
    return () => clearTimeout(timeoutId);
  }, [userId, date, entries, calculateToilForDay, autoRefresh]);

  return {
    toilSummary,
    isLoading,
    error,
    isCalculating,
    calculateToilForDay,
    triggerTOILCalculation,
    isToilEntry,
    refreshSummary
  };
}

export default useUnifiedTOIL;
