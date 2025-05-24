
import { useEffect, useMemo } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { useToilState } from './hooks/useToilState';
import { useToilCache } from './hooks/useToilCache';
import { useToilEvents } from './hooks/useToilEvents';
import { useToilCalculation } from './hooks/useToilCalculation';
import { toilCircuitBreaker } from '@/utils/time/services/toil/circuitBreaker';

// Create a logger for this hook
const logger = createTimeLogger('useUnifiedTOIL');

// OPTIMIZED: Increased refresh intervals to reduce cascading
const DEFAULT_REFRESH_INTERVAL = 5000; // 5 seconds

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
  
  // Circuit breaker controls
  circuitBreakerStatus: any;
  stopCalculations: () => void;
  resumeCalculations: () => void;
}

/**
 * Unified TOIL hook that provides comprehensive TOIL functionality
 * REFACTORED: Now uses circuit breaker to prevent cascading calculations
 */
export function useUnifiedTOIL({
  userId,
  date,
  entries = [],
  workSchedule,
  options = {}
}: UseUnifiedTOILProps): UseUnifiedTOILResult {
  // Default options with increased intervals
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
      refreshSummary: () => {},
      circuitBreakerStatus: { globallyDisabled: false, calculationsInProgress: 0 },
      stopCalculations: () => {},
      resumeCalculations: () => {}
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

  // Use the calculation hook with circuit breaker integration
  const {
    calculateToilForDay: originalCalculateToilForDay,
    triggerTOILCalculation: originalTriggerTOILCalculation,
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

  // Wrap calculation functions with circuit breaker
  const calculateToilForDay = useMemo(() => async (): Promise<TOILSummary | null> => {
    if (!toilCircuitBreaker.canCalculate(userId, monthYear)) {
      logger.debug(`Circuit breaker blocking TOIL calculation for ${userId}-${monthYear}`);
      return toilSummary;
    }

    toilCircuitBreaker.startCalculation(userId, monthYear);
    try {
      const result = await originalCalculateToilForDay();
      return result;
    } finally {
      toilCircuitBreaker.finishCalculation(userId, monthYear);
    }
  }, [userId, monthYear, originalCalculateToilForDay, toilSummary]);

  const triggerTOILCalculation = useMemo(() => async (): Promise<TOILSummary | null> => {
    if (!toilCircuitBreaker.canCalculate(userId, monthYear)) {
      logger.debug(`Circuit breaker blocking manual TOIL calculation for ${userId}-${monthYear}`);
      return toilSummary;
    }

    toilCircuitBreaker.startCalculation(userId, monthYear);
    try {
      const result = await originalTriggerTOILCalculation();
      return result;
    } finally {
      toilCircuitBreaker.finishCalculation(userId, monthYear);
    }
  }, [userId, monthYear, originalTriggerTOILCalculation, toilSummary]);

  // Use the events hook with reduced frequency
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

  // IMPROVED: More conservative calculation when entries change
  // Create a stable reference for the entries array to detect actual changes
  const entriesKey = useMemo(() => {
    return entries.map(e => `${e.id}-${e.hours}-${e.date}`).join('|');
  }, [entries]);

  useEffect(() => {
    if (!userId || !date || !autoRefresh) return;
    
    // Check circuit breaker before proceeding
    if (!toilCircuitBreaker.canCalculate(userId, monthYear)) {
      logger.debug('Circuit breaker blocking entries change calculation');
      return;
    }
    
    logger.debug(`Entries changed (${entries.length} entries), scheduling TOIL calculation with increased delay`);
    
    // INCREASED timeout for more conservative updates
    const timeoutId = setTimeout(() => {
      if (toilCircuitBreaker.canCalculate(userId, monthYear)) {
        logger.debug('Calculating TOIL due to entries change');
        calculateToilForDay();
      } else {
        logger.debug('Circuit breaker prevented scheduled calculation');
      }
    }, 1000); // Increased from 50ms to 1000ms for better stability
    
    return () => clearTimeout(timeoutId);
  }, [userId, date, entriesKey, calculateToilForDay, autoRefresh, monthYear]); // Use entriesKey instead of entries

  // Circuit breaker control functions
  const stopCalculations = useMemo(() => () => {
    toilCircuitBreaker.stopAllCalculations();
    logger.info('TOIL calculations stopped by user');
  }, []);

  const resumeCalculations = useMemo(() => () => {
    toilCircuitBreaker.resumeCalculations();
    logger.info('TOIL calculations resumed by user');
  }, []);

  // Get circuit breaker status
  const circuitBreakerStatus = useMemo(() => toilCircuitBreaker.getStatus(), []);

  return {
    toilSummary,
    isLoading,
    error,
    isCalculating,
    calculateToilForDay,
    triggerTOILCalculation,
    isToilEntry,
    refreshSummary,
    circuitBreakerStatus,
    stopCalculations,
    resumeCalculations
  };
}

export default useUnifiedTOIL;
