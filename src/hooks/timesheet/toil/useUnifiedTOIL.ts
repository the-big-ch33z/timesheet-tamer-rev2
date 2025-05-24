import { useEffect, useMemo, useCallback, useState } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { useToilState } from './hooks/useToilState';
import { useToilCache } from './hooks/useToilCache';
import { useToilEvents } from './hooks/useToilEvents';
import { useToilCalculation } from './hooks/useToilCalculation';
import { toilCircuitBreaker } from '@/utils/time/services/toil/circuitBreaker';
import { debugToilDataState } from '@/utils/time/services/toil/unifiedDeletion';

// Create a logger for this hook
const logger = createTimeLogger('useUnifiedTOIL');

// OPTIMIZED: Much more conservative refresh intervals
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

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
 * ENHANCED: Now supports circuit breaker bypass for critical operations
 */
export function useUnifiedTOIL({
  userId,
  date,
  entries = [],
  workSchedule,
  options = {}
}: UseUnifiedTOILProps): UseUnifiedTOILResult {
  // Default options with much more conservative intervals
  const { 
    monthOnly = false,
    autoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    testProps
  } = options;

  // Test mode requires both testProps and explicit flag
  const isTestMode = !!(testProps && testProps.testModeEnabled === true);
  const monthYear = useMemo(() => format(date, 'yyyy-MM'), [date]);

  console.log(`[TOIL-DEBUG] useUnifiedTOIL called for ${userId} in ${monthYear}`, {
    entriesCount: entries.length,
    isTestMode,
    workSchedule: workSchedule?.name || 'None'
  });

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
      console.log(`[TOIL-DEBUG] Work schedule for ${userId}:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        weeksCount: workSchedule.weeks ? Object.keys(workSchedule.weeks).length : 0,
        rdoDaysCount: workSchedule.rdoDays ? Object.keys(workSchedule.rdoDays).length : 0
      });
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        userId,
        weeksCount: workSchedule.weeks ? Object.keys(workSchedule.weeks).length : 0,
        rdoDaysCount: workSchedule.rdoDays ? Object.keys(workSchedule.rdoDays).length : 0
      });
    } else {
      console.log(`[TOIL-DEBUG] ⚠️ No work schedule provided for user ${userId} - TOIL calculation may be inaccurate`);
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
      console.log(`[TOIL-DEBUG] ⚠️ Circuit breaker blocking TOIL calculation for ${userId}-${monthYear}`);
      logger.debug(`Circuit breaker blocking TOIL calculation for ${userId}-${monthYear}`);
      return toilSummary;
    }

    console.log(`[TOIL-DEBUG] ==> STARTING TOIL CALCULATION for ${userId}-${monthYear}`);
    toilCircuitBreaker.startCalculation(userId, monthYear);
    try {
      const result = await originalCalculateToilForDay();
      console.log(`[TOIL-DEBUG] ✅ TOIL calculation completed for ${userId}-${monthYear}`, result);
      return result;
    } finally {
      toilCircuitBreaker.finishCalculation(userId, monthYear);
    }
  }, [userId, monthYear, originalCalculateToilForDay, toilSummary]);

  const triggerTOILCalculation = useMemo(() => async (): Promise<TOILSummary | null> => {
    if (!toilCircuitBreaker.canCalculate(userId, monthYear)) {
      console.log(`[TOIL-DEBUG] ⚠️ Circuit breaker blocking manual TOIL calculation for ${userId}-${monthYear}`);
      logger.debug(`Circuit breaker blocking manual TOIL calculation for ${userId}-${monthYear}`);
      return toilSummary;
    }

    console.log(`[TOIL-DEBUG] ==> STARTING MANUAL TOIL CALCULATION for ${userId}-${monthYear}`);
    toilCircuitBreaker.startCalculation(userId, monthYear);
    try {
      const result = await originalTriggerTOILCalculation();
      console.log(`[TOIL-DEBUG] ✅ Manual TOIL calculation completed for ${userId}-${monthYear}`, result);
      return result;
    } finally {
      toilCircuitBreaker.finishCalculation(userId, monthYear);
    }
  }, [userId, monthYear, originalTriggerTOILCalculation, toilSummary]);

  // Use the events hook with much more conservative frequency
  useToilEvents({
    userId,
    monthYear,
    setToilSummary,
    setIsLoading,
    refreshSummary,
    isTestMode
  });

  // Initialize TOIL summary only once
  useEffect(() => {
    if (!userId || !date) return;
    console.log(`[TOIL-DEBUG] Initializing TOIL summary for ${userId} on ${date.toISOString()}`);
    loadSummary();
  }, [userId, date, loadSummary]);

  // SIMPLIFIED: Only calculate when entries actually change content, not on every render
  // Create a stable reference for the entries array to detect actual changes
  const entriesKey = useMemo(() => {
    const key = entries.map(e => `${e.id}-${e.hours}-${e.date}`).join('|');
    console.log(`[TOIL-DEBUG] Entries key for ${userId}: ${key} (${entries.length} entries)`);
    return key;
  }, [entries, userId]);

  // Add debug mode state
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ENHANCED: Listen for unified deletion events with regeneration bypass
  useEffect(() => {
    const handleToilDataDeleted = (event: CustomEvent) => {
      console.log(`[TOIL-DEBUG] ✅ TOILSummaryCard received toilDataDeleted event for ${userId}`, event.detail);
      logger.debug('Received toilDataDeleted event, refreshing summary');
      
      const { regenerated } = event.detail || {};
      
      if (regenerated) {
        console.log(`[TOIL-DEBUG] ✅ TOIL data was regenerated, triggering immediate refresh`);
        setIsRegenerating(false);
        // Immediate refresh since data was regenerated
        setTimeout(() => {
          refreshSummary();
          setLastUpdated(new Date());
        }, 50);
      } else {
        console.log(`[TOIL-DEBUG] ⚠️ TOIL data was deleted but not regenerated, enabling bypass for manual refresh`);
        setIsRegenerating(true);
        
        // ENABLE BYPASS MODE for manual regeneration
        toilCircuitBreaker.enableBypassMode();
        
        // Longer delay for potential manual regeneration
        setTimeout(() => {
          refreshSummary();
          setLastUpdated(new Date());
          setIsRegenerating(false);
          
          // DISABLE BYPASS MODE after regeneration
          toilCircuitBreaker.disableBypassMode();
        }, 2000);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('toilDataDeleted', handleToilDataDeleted as EventListener);
      console.log(`[TOIL-DEBUG] ✅ TOILSummaryCard listening for deletion events for ${userId}`);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toilDataDeleted', handleToilDataDeleted as EventListener);
        console.log(`[TOIL-DEBUG] TOILSummaryCard stopped listening for deletion events for ${userId}`);
      }
    };
  }, [refreshSummary, userId]);
  
  // ENHANCED: Manual refresh with regeneration capability and bypass mode
  const handleManualRefresh = useCallback(async () => {
    if (circuitBreakerStatus.globallyDisabled && !toilCircuitBreaker.canCalculate(userId, monthYear)) {
      console.log(`[TOIL-DEBUG] ⚠️ Manual refresh blocked by circuit breaker for ${userId}`);
      logger.debug('Manual refresh blocked by circuit breaker');
      return;
    }
    
    console.log(`[TOIL-DEBUG] ==> MANUAL REFRESH requested for ${userId}`);
    logger.debug('Manual refresh requested');
    setIsRefreshing(true);
    
    // Enable bypass mode for manual operations
    toilCircuitBreaker.enableBypassMode();
    
    try {
      // If no TOIL data exists and we have entries, trigger regeneration
      const currentState = debugToilDataState(userId);
      if (!currentState.hasRecords && !currentState.hasUsage && monthEntries.length > 0 && workSchedule) {
        console.log(`[TOIL-DEBUG] 🔄 No TOIL data found but entries exist, triggering regeneration with bypass`);
        setIsRegenerating(true);
        
        try {
          // Import and use the TOIL service to regenerate
          const { toilService } = await import('@/utils/time/services/toil/service/factory');
          if (toilService && workSchedule) {
            await toilService.calculateAndStoreTOIL(
              monthEntries,
              date,
              userId,
              workSchedule,
              [] // holidays
            );
            console.log(`[TOIL-DEBUG] ✅ Manual regeneration completed with bypass`);
          }
        } catch (error) {
          console.error(`[TOIL-DEBUG] ❌ Manual regeneration failed:`, error);
        } finally {
          setIsRegenerating(false);
        }
      }
      
      refreshSummary();
      setLastUpdated(new Date());
    } finally {
      // Always disable bypass mode after manual operation
      toilCircuitBreaker.disableBypassMode();
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  }, [refreshSummary, circuitBreakerStatus.globallyDisabled, userId, monthEntries, workSchedule, date, monthYear]);

  useEffect(() => {
    if (!userId || !date || !autoRefresh || !entriesKey) return;
    
    // Check circuit breaker before proceeding
    if (!toilCircuitBreaker.canCalculate(userId, monthYear)) {
      console.log(`[TOIL-DEBUG] ⚠️ Circuit breaker blocking entries change calculation for ${userId}-${monthYear}`);
      logger.debug('Circuit breaker blocking entries change calculation');
      return;
    }
    
    // CONSERVATIVE: Only recalculate if we have actual entries and much longer delay
    if (entries.length > 0) {
      console.log(`[TOIL-DEBUG] ==> ENTRIES CHANGED for ${userId} (${entries.length} entries), scheduling conservative TOIL calculation`);
      logger.debug(`Entries content changed (${entries.length} entries), scheduling conservative TOIL calculation`);
      
      const timeoutId = setTimeout(() => {
        if (toilCircuitBreaker.canCalculate(userId, monthYear)) {
          console.log(`[TOIL-DEBUG] ✅ Executing scheduled TOIL calculation due to entries change`);
          logger.debug('Calculating TOIL due to entries change (conservative)');
          calculateToilForDay();
        } else {
          console.log(`[TOIL-DEBUG] ⚠️ Circuit breaker prevented scheduled calculation`);
          logger.debug('Circuit breaker prevented scheduled calculation');
        }
      }, 5000); // Much longer delay: 5 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [userId, date, entriesKey, calculateToilForDay, autoRefresh, monthYear, entries.length]);

  // Circuit breaker control functions
  const stopCalculations = useMemo(() => () => {
    toilCircuitBreaker.stopAllCalculations();
    console.log(`[TOIL-DEBUG] ⏹️ TOIL calculations stopped by user`);
    logger.info('TOIL calculations stopped by user');
  }, []);

  const resumeCalculations = useMemo(() => () => {
    toilCircuitBreaker.resumeCalculations();
    console.log(`[TOIL-DEBUG] ▶️ TOIL calculations resumed by user`);
    logger.info('TOIL calculations resumed by user');
  }, []);

  // Get circuit breaker status
  const circuitBreakerStatus = useMemo(() => toilCircuitBreaker.getStatus(), []);

  // Log summary changes
  useEffect(() => {
    if (toilSummary) {
      console.log(`[TOIL-DEBUG] ✅ TOIL Summary updated for ${userId}-${monthYear}:`, {
        accrued: toilSummary.accrued,
        used: toilSummary.used,
        remaining: toilSummary.remaining
      });
    }
  }, [toilSummary, userId, monthYear]);

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
