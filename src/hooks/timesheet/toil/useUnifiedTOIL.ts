
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

// More responsive refresh interval (5s instead of 30s)
const DEFAULT_REFRESH_INTERVAL = 5000;

// More responsive debounce period (300ms instead of 1000ms)  
const DEFAULT_OPERATION_DEBOUNCE = 300; 

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
      testModeEnabled?: boolean; // Added explicit flag for test mode
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
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Additional state for internal tracking
  const isMountedRef = useRef(true);
  const lastOperationTimeRef = useRef<number>(0);
  const calculationInProgressRef = useRef<boolean>(false);
  const updateAttemptsRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const entriesRef = useRef<TimeEntry[]>([]);
  const processedDatesRef = useRef<Set<string>>(new Set());
  const monthYear = useMemo(() => format(date, 'yyyy-MM'), [date]);
  const summaryLoadedRef = useRef(false);

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

  // Log work schedule information
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault
      });
    } else {
      logger.debug(`No work schedule provided for user ${userId}`);
    }
  }, [workSchedule, userId]);

  // Clear caches when month changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    logger.debug(`Month changed to ${monthYear}, clearing TOIL cache`);
    clearCacheForCurrentMonth(userId, date);
    toilService.clearCache();
    setRefreshCounter(c => c + 1); // Force a refresh when month changes
  }, [monthYear, userId, date]);

  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);

  // Load TOIL summary with improved state management
  const loadSummary = useCallback(() => {
    if (!isMountedRef.current) {
      logger.debug('Component unmounted, aborting loadSummary');
      return;
    }
    
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    // Circuit breaker for too many updates
    const now = Date.now();
    if (updateAttemptsRef.current > 20 && now - lastUpdateTimeRef.current < 30000) {
      logger.warn('Circuit breaker activated - too many update attempts in short period');
      setIsLoading(false);
      return;
    }
    
    updateAttemptsRef.current++;
    lastUpdateTimeRef.current = now;

    // Only show loading on first load or if explicitly reset
    if (!summaryLoadedRef.current) {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      logger.debug(`Loading summary for ${userId} in ${monthYear}`);
      
      // Use more aggressive cache clearing for better reactivity
      if (!monthOnly) {
        clearCacheForCurrentMonth(userId, date);
      }
      
      // Use the toilService directly
      const result = toilService.getTOILSummary(userId, monthYear);
      
      if (!isMountedRef.current) {
        logger.debug('Component unmounted during loadSummary, aborting state update');
        return;
      }

      if (!result) {
        const defaultSummary = { userId, monthYear, accrued: 0, used: 0, remaining: 0 };
        setToilSummary(defaultSummary);
        logger.debug(`No summary found, using default`);
      } else {
        setToilSummary(result);
        logger.debug(`Summary loaded: accrued=${result.accrued}, used=${result.used}, remaining=${result.remaining}`);
      }
      
      // IMPORTANT: Always update loading state and mark as loaded
      setIsLoading(false);
      summaryLoadedRef.current = true;
    } catch (err) {
      logger.error(`Error getting summary:`, err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Still set a default summary on error
        setToilSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
        // IMPORTANT: Always update loading state on error too
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, date, monthOnly]);

  // Calculate TOIL for the day with improved state handling
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      // Set calculating state at the beginning
      if (!isMountedRef.current) {
        return null;
      }
      
      setIsCalculating(true);
      
      // Add circuit breaker for calculations
      const now = Date.now();
      if (calculationInProgressRef.current) {
        logger.debug('Skipping TOIL calculation - another one is in progress');
        return null;
      }
      
      // Reduce debounce period for more responsive updates
      if (now - lastOperationTimeRef.current < DEFAULT_OPERATION_DEBOUNCE) {
        logger.debug('Skipping TOIL calculation due to rate limiting');
        return null;
      }
      
      // Mark calculation as in progress and update last operation time
      calculationInProgressRef.current = true;
      lastOperationTimeRef.current = now;
      
      logger.debug(`calculateToilForDay called for date ${format(date, 'yyyy-MM-dd')}`);
      
      // Return early if missing required data or component unmounted
      if (!userId || !date) {
        logger.debug('Missing required data for TOIL calculation');
        
        if (isMountedRef.current) {
          setIsCalculating(false);
        }
        
        calculationInProgressRef.current = false;
        return null;
      }
      
      // Store current entries in ref to compare later
      entriesRef.current = [...entries];
      
      // Filter entries for efficiency
      const dateKey = format(date, 'yyyy-MM-dd');
      logger.debug(`Processing day ${dateKey} with ${entries.length} entries`);
      
      // Process TOIL usage entries first
      const toilUsageEntries = entries.filter(isToilEntry);
      const nonToilEntries = entries.filter(entry => !isToilEntry(entry));
      
      logger.debug(`Found ${toilUsageEntries.length} TOIL usage entries and ${nonToilEntries.length} regular entries`);
      
      // Process each TOIL usage entry
      for (const entry of toilUsageEntries) {
        logger.debug(`Processing TOIL usage entry: ${entry.id}, hours: ${entry.hours}`);
        await toilService.recordTOILUsage(entry);
      }
      
      // Calculate and store TOIL accrual with holidays
      logger.debug(`Calculating TOIL accrual for ${nonToilEntries.length} entries`);
      const summary = await toilService.calculateAndStoreTOIL(
        nonToilEntries,
        date,
        userId,
        workSchedule,
        holidays
      );
      
      logger.debug(`TOIL summary after calculation:`, summary);
      
      // Ensure the monthYear field is set
      if (summary && !summary.monthYear) {
        summary.monthYear = monthYear;
      }
      
      // Update internal state if component still mounted
      if (isMountedRef.current) {
        setToilSummary(summary);
        
        // IMPORTANT: Make sure to update loading state when we have data
        setIsLoading(false);
        summaryLoadedRef.current = true;
        
        // Dispatch event with all required fields
        unifiedTOILEventService.dispatchTOILSummaryEvent(summary);
      }
      
      return summary;
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      
      // Dispatch error event
      unifiedTOILEventService.dispatchTOILErrorEvent(
        'Error calculating TOIL',
        error,
        userId
      );
      
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : String(error));
        // IMPORTANT: Always update loading state on error too
        setIsLoading(false);
      }
      
      return null;
    } finally {
      // Always reset calculating state if component is mounted
      if (isMountedRef.current) {
        setIsCalculating(false);
      }
      
      // Release the lock
      calculationInProgressRef.current = false;
    }
  }, [userId, date, entries, workSchedule, monthYear, isToilEntry, holidays]);

  // Trigger calculation with improved event handling
  const triggerTOILCalculation = useCallback(async (): Promise<TOILSummary | null> => {
    logger.debug('Manually triggering TOIL calculation');
    
    try {
      // Notify that calculation is starting with all required fields
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'starting',
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear // Add monthYear for proper event targeting
      } as TOILEventData);
      
      const result = await calculateToilForDay();
      
      // Notify that calculation is complete with all required fields
      if (result) {
        // Ensure monthYear is set
        if (!result.monthYear) {
          result.monthYear = monthYear;
        }
        
        unifiedTOILEventService.dispatchTOILSummaryEvent(result);
      }
      
      // Also publish the calculation completed event with all required fields
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'completed',
        summary: result,
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear, // Add monthYear for proper event targeting
        requiresRefresh: true
      } as TOILEventData);
      
      logger.debug('Manual TOIL calculation complete');
      return result;
    } catch (error) {
      logger.error('Error during manual TOIL calculation:', error);
      
      // Notify about error with all required fields
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date: date.toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        source: 'useUnifiedTOIL',
        monthYear // Add monthYear for proper event targeting
      } as TOILEventData);
      
      if (isMountedRef.current) {
        setIsLoading(false);
        setError(error instanceof Error ? error.message : String(error));
      }
      
      throw error;
    }
  }, [calculateToilForDay, userId, date, monthYear]);

  // Refresh summary with more explicit state management
  const refreshSummary = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastOperationTimeRef.current < DEFAULT_OPERATION_DEBOUNCE) {
      logger.debug('Skipping duplicate refresh due to debounce');
      return;
    }
    lastOperationTimeRef.current = now;
    
    logger.debug(`Refresh requested for ${userId}`);
    
    // Aggressive cache clearing for immediate feedback
    clearCacheForCurrentMonth(userId, date);
    
    // Reset loading state for an explicit refresh to show feedback
    setIsLoading(true);
    summaryLoadedRef.current = false;
    
    // Trigger a reload through the counter
    setRefreshCounter(c => c + 1);
  }, [userId, date]);

  // Initialize TOIL summary when component mounts or user/date changes
  useEffect(() => {
    if (!userId || !date) return;
    
    // Reset summary loaded flag when user or date changes
    summaryLoadedRef.current = false;
    
    // Set loading state explicitly
    setIsLoading(true);
    
    // Trigger immediate load
    loadSummary();
  }, [userId, date, loadSummary]);

  // Set up event listeners for TOIL updates with improved event handling
  useEffect(() => {
    // Create a unified handler using the factory function from the unified service
    const handleTOILUpdate = unifiedTOILEventService.createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          if (!isMountedRef.current) return;
          
          logger.debug('Received valid TOIL update:', data);
          setToilSummary(data);
          
          // IMPORTANT: Always update loading state when we get valid data
          setIsLoading(false);
          summaryLoadedRef.current = true;
        },
        onRefresh: refreshSummary,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    // Listen for DOM events - standard part of the event system
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    // Subscribe to EventBus events with improved data validation
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (!isMountedRef.current) return;
      
      // Enhanced data validation with multiple matching approaches
      const isRelevantUpdate = (
        data?.userId === userId && (
          data?.monthYear === monthYear ||
          data?.date?.startsWith(monthYear)
        )
      );
      
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      
      if (isRelevantUpdate) {
        logger.debug(`Matched TOIL update for ${userId} in ${monthYear}`);
        refreshSummary();
      }
    });

    // Special handler for the CALCULATED event
    const calculatedSubscription = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: TOILEventData) => {
      if (!isMountedRef.current) return;
      
      logger.debug(`TOIL_EVENTS.CALCULATED received:`, data);
      
      // Enhanced data validation with multiple matching approaches
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
      // Clean up all event listeners properly
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof subscription === 'function') subscription();
      if (typeof calculatedSubscription === 'function') calculatedSubscription();
    };
  }, [userId, monthYear, refreshSummary]);

  // Refresh when refreshCounter changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    loadSummary();
  }, [loadSummary, refreshCounter]);

  // Debounced calculation when entries change
  useEffect(() => {
    if (!userId || !date || !autoRefresh || !isMountedRef.current) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Skip calculation if entries haven't changed
    if (entries.length === 0 || 
        (processedDatesRef.current.has(dateKey) && 
         entries.length === entriesRef.current.length)) {
      return;
    }
    
    logger.debug(`Entries changed (${entries.length} entries), debouncing TOIL calculation`);
    
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      logger.debug('Debounce time elapsed, calculating TOIL');
      calculateToilForDay().then(() => {
        // Mark this date as processed
        processedDatesRef.current.add(dateKey);
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [userId, date, entries, calculateToilForDay, autoRefresh]);

  // Auto-refresh interval with improved handling
  useEffect(() => {
    if (!autoRefresh || !isMountedRef.current) return;
    
    logger.debug(`Setting up auto-refresh interval (${refreshInterval}ms)`);
    
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refreshSummary();
      }
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshSummary]);

  // Force initial refresh with better mount handling
  useEffect(() => {
    isMountedRef.current = true;
    // Short delay to let other initialization complete
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        logger.debug('Initial refresh after component mount');
        refreshSummary();
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isMountedRef.current = false;
    };
  }, [refreshSummary]);

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
