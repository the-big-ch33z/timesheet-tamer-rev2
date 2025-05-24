
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { toilService, clearCacheForCurrentMonth } from '@/utils/time/services/toil';
import { getHolidays } from '@/lib/holidays';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { TOIL_JOB_NUMBER } from '@/utils/time/services/toil';

// Create a logger for this hook
const logger = createTimeLogger('useUnifiedTOIL');

// OPTIMIZED: More responsive refresh intervals
const DEFAULT_REFRESH_INTERVAL = 3000; // Reduced from 5s to 3s
const DEFAULT_OPERATION_DEBOUNCE = 150; // Reduced from 300ms to 150ms

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
 * OPTIMIZED: Simplified logic and more responsive calculations
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
  
  // State management
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(
    isTestMode ? testProps?.summary : null
  );
  const [isLoading, setIsLoading] = useState(!isTestMode);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // SIMPLIFIED: Reduced internal tracking complexity
  const isMountedRef = useRef(true);
  const lastOperationTimeRef = useRef<number>(0);
  const calculationInProgressRef = useRef<boolean>(false);
  const monthYear = useMemo(() => format(date, 'yyyy-MM'), [date]);

  // Cache holidays to avoid recalculating
  const holidays = useMemo(() => getHolidays(), []);

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

  // ENHANCED: Log work schedule and entries data for debugging
  useEffect(() => {
    logger.debug(`=== useUnifiedTOIL Debug Info ===`);
    logger.debug(`User: ${userId}, Month: ${monthYear}`);
    logger.debug(`Entries count: ${entries.length}`);
    logger.debug(`Work schedule: ${workSchedule ? workSchedule.name : 'None provided'}`);
    
    if (entries.length > 0) {
      logger.debug('Entries details:', entries.map(e => 
        `${format(new Date(e.date), 'yyyy-MM-dd')}: ${e.hours}h (${e.jobNumber || 'no job'})`
      ));
    }
    
    if (workSchedule) {
      logger.debug(`Work schedule details:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        weekCount: Object.keys(workSchedule.weeks).length,
        rdoDays: Object.keys(workSchedule.rdoDays).length
      });
    } else {
      logger.warn(`⚠️ No work schedule provided - TOIL calculations may be incorrect!`);
    }
    logger.debug(`=== End Debug Info ===`);
  }, [workSchedule, userId, entries, monthYear]);

  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);

  // SIMPLIFIED: Load TOIL summary with better error handling
  const loadSummary = useCallback(() => {
    if (!isMountedRef.current || !userId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug(`Loading summary for ${userId} in ${monthYear}`);
      
      // Use the toilService directly
      const result = toilService.getTOILSummary(userId, monthYear);
      
      if (!isMountedRef.current) {
        return;
      }

      const finalSummary = result || { userId, monthYear, accrued: 0, used: 0, remaining: 0 };
      setToilSummary(finalSummary);
      
      logger.debug(`Summary loaded: accrued=${finalSummary.accrued}, used=${finalSummary.used}, remaining=${finalSummary.remaining}`);
      
      setIsLoading(false);
    } catch (err) {
      logger.error(`Error getting summary:`, err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setToilSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
        setIsLoading(false);
      }
    }
  }, [userId, monthYear]);

  // ENHANCED: Calculate TOIL for the day with proper work schedule handling
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      if (!isMountedRef.current || calculationInProgressRef.current) {
        return null;
      }
      
      setIsCalculating(true);
      
      // REDUCED: Shorter debounce period for more responsive updates
      const now = Date.now();
      if (now - lastOperationTimeRef.current < DEFAULT_OPERATION_DEBOUNCE) {
        logger.debug('Skipping TOIL calculation due to rate limiting');
        return null;
      }
      
      calculationInProgressRef.current = true;
      lastOperationTimeRef.current = now;
      
      logger.debug(`calculateToilForDay called for date ${format(date, 'yyyy-MM-dd')} with ${entries.length} entries`);
      
      if (!userId || !date) {
        logger.debug('Missing required data for TOIL calculation');
        if (isMountedRef.current) setIsCalculating(false);
        calculationInProgressRef.current = false;
        return null;
      }

      // CRITICAL: Log work schedule before calculation
      if (workSchedule) {
        logger.debug(`✅ Using work schedule "${workSchedule.name}" for TOIL calculation`);
      } else {
        logger.warn(`⚠️ No work schedule provided to calculateToilForDay - calculations may be incorrect!`);
      }
      
      // Process TOIL usage entries first
      const toilUsageEntries = entries.filter(isToilEntry);
      const nonToilEntries = entries.filter(entry => !isToilEntry(entry));
      
      logger.debug(`Found ${toilUsageEntries.length} TOIL usage entries and ${nonToilEntries.length} regular entries`);
      
      // Process each TOIL usage entry
      for (const entry of toilUsageEntries) {
        logger.debug(`Processing TOIL usage entry: ${entry.id}, hours: ${entry.hours}`);
        await toilService.recordTOILUsage(entry);
      }
      
      // ENHANCED: Calculate and store TOIL accrual with proper work schedule logging
      logger.debug(`🔄 Calculating TOIL accrual for ${nonToilEntries.length} entries`);
      logger.debug(`📋 Work schedule for calculation:`, workSchedule ? {
        name: workSchedule.name,
        id: workSchedule.id
      } : 'NONE - using defaults');
      
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule, // CRITICAL: Ensure work schedule is passed
        holidays
      );
      
      logger.debug(`✅ TOIL summary after calculation:`, summary);
      
      // Ensure the monthYear field is set
      if (summary && !summary.monthYear) {
        summary.monthYear = monthYear;
      }
      
      // Update internal state if component still mounted
      if (isMountedRef.current) {
        setToilSummary(summary);
        setIsLoading(false);
        
        // Dispatch event with all required fields
        unifiedTOILEventService.dispatchTOILSummaryEvent(summary);
      }
      
      return summary;
    } catch (error) {
      logger.error('❌ Error calculating TOIL:', error);
      
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
  }, [userId, date, entries, workSchedule, monthYear, isToilEntry, holidays]);

  // Trigger calculation with improved event handling
  const triggerTOILCalculation = useCallback(async (): Promise<TOILSummary | null> => {
    logger.debug('🚀 Manually triggering TOIL calculation');
    
    try {
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'starting',
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear
      } as TOILEventData);
      
      const result = await calculateToilForDay();
      
      if (result) {
        if (!result.monthYear) {
          result.monthYear = monthYear;
        }
        unifiedTOILEventService.dispatchTOILSummaryEvent(result);
      }
      
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'completed',
        summary: result,
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear,
        requiresRefresh: true
      } as TOILEventData);
      
      logger.debug('✅ Manual TOIL calculation complete');
      return result;
    } catch (error) {
      logger.error('❌ Error during manual TOIL calculation:', error);
      
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear
      } as TOILEventData);
      
      if (isMountedRef.current) {
        setIsLoading(false);
        setError(error instanceof Error ? error.message : String(error));
      }
      
      throw error;
    }
  }, [calculateToilForDay, userId, date, monthYear]);

  // SIMPLIFIED: Refresh summary with explicit state management
  const refreshSummary = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastOperationTimeRef.current < DEFAULT_OPERATION_DEBOUNCE) {
      return;
    }
    lastOperationTimeRef.current = now;
    
    logger.debug(`🔄 Refresh requested for ${userId}`);
    
    // Clear cache for immediate feedback
    clearCacheForCurrentMonth(userId, date);
    
    // Trigger immediate reload
    loadSummary();
  }, [userId, date, loadSummary]);

  // Initialize TOIL summary
  useEffect(() => {
    if (!userId || !date) return;
    loadSummary();
  }, [userId, date, loadSummary]);

  // ENHANCED: Auto-calculate when entries change with work schedule verification
  useEffect(() => {
    if (!userId || !date || !autoRefresh || !isMountedRef.current || entries.length === 0) return;
    
    logger.debug(`📝 Entries changed (${entries.length} entries), scheduling TOIL calculation`);
    logger.debug(`🏢 Work schedule available: ${workSchedule ? 'Yes (' + workSchedule.name + ')' : 'No - will use defaults'}`);
    
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      logger.debug('⏰ Debounce time elapsed, calculating TOIL');
      calculateToilForDay();
    }, 200); // Reduced from 500ms to 200ms for more responsive calculations
    
    return () => clearTimeout(timeoutId);
  }, [userId, date, entries, calculateToilForDay, autoRefresh, workSchedule]);

  // OPTIMIZED: Set up event listeners with reduced complexity
  useEffect(() => {
    const handleTOILUpdate = unifiedTOILEventService.createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          if (!isMountedRef.current) return;
          logger.debug('Received valid TOIL update:', data);
          setToilSummary(data);
          setIsLoading(false);
        },
        onRefresh: refreshSummary,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (!isMountedRef.current) return;
      
      const isRelevantUpdate = (
        data?.userId === userId && (
          data?.monthYear === monthYear ||
          data?.date?.startsWith(monthYear)
        )
      );
      
      if (isRelevantUpdate) {
        logger.debug(`Matched TOIL update for ${userId} in ${monthYear}`);
        refreshSummary();
      }
    });

    const calculatedSubscription = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: TOILEventData) => {
      if (!isMountedRef.current) return;
      
      const isRelevantCalculation = (
        data?.userId === userId && (
          data?.monthYear === monthYear ||
          data?.date?.startsWith(monthYear) ||
          data?.requiresRefresh === true
        )
      );
      
      if (isRelevantCalculation) {
        logger.debug(`Matched TOIL calculation for ${userId} in ${monthYear}`);
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof subscription === 'function') subscription();
      if (typeof calculatedSubscription === 'function') calculatedSubscription();
    };
  }, [userId, monthYear, refreshSummary]);

  // Component cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
