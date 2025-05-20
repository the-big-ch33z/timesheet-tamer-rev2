
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WorkSchedule, TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { toilService, clearCacheForCurrentMonth } from '@/utils/time/services/toil';
import { getHolidays } from '@/lib/holidays';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { TOIL_JOB_NUMBER } from '@/utils/time/services/toil';

// Create a logger for this hook
const logger = createTimeLogger('useUnifiedTOIL');

export interface UseUnifiedTOILProps {
  userId: string;
  date: Date;
  entries?: TimeEntry[];
  workSchedule?: WorkSchedule;
  options?: {
    monthOnly?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
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
 * Unified TOIL hook that combines functionality from multiple hooks:
 * - useTOILCalculations
 * - useTOILSummary
 * - useTOILTriggers
 * 
 * This provides a comprehensive API for TOIL operations in a single hook.
 * 
 * @param props Hook configuration
 * @returns Unified TOIL functionality
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
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State from useTOILSummary
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Cache holidays to avoid recalculating
  const holidays = useMemo(() => getHolidays(), []);

  // Log work schedule information when it changes
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        weeks: Object.keys(workSchedule.weeks).length > 0 ? 'available' : 'empty',
        rdoDays: Object.keys(workSchedule.rdoDays).length > 0 ? 'available' : 'empty'
      });
    } else {
      logger.warn(`No work schedule provided for user ${userId} - TOIL calculation may be incorrect`);
    }
  }, [workSchedule, userId]);

  // Clear caches when month changes
  useEffect(() => {
    logger.debug(`Month changed to ${monthYear}, clearing TOIL cache`);
    clearCacheForCurrentMonth(userId, date);
    toilService.clearCache();
  }, [monthYear, userId, date]);

  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);

  // Load TOIL summary
  const loadSummary = useCallback(() => {
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

    setIsLoading(true);
    setError(null);

    try {
      logger.debug(`Loading summary for ${userId} in ${monthYear}`);
      
      // Use more aggressive cache clearing for better reactivity
      if (!monthOnly) {
        clearCacheForCurrentMonth(userId, date);
      }
      
      // Use the toilService directly
      const result = toilService.getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      if (!result) {
        const defaultSummary = { userId, monthYear, accrued: 0, used: 0, remaining: 0 };
        setToilSummary(defaultSummary);
        logger.debug(`No summary found, using default`);
      } else {
        setToilSummary(result);
        logger.debug(`Summary loaded: accrued=${result.accrued}, used=${result.used}, remaining=${result.remaining}`);
      }
    } catch (err) {
      logger.error(`Error getting summary:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setToilSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        
        // Reset circuit breaker after successful load
        if (updateAttemptsRef.current > 20) {
          setTimeout(() => {
            updateAttemptsRef.current = 0;
          }, 30000);
        }
      }
    }
  }, [userId, monthYear, date, monthOnly]);

  // Calculate TOIL for the day - from useTOILCalculations
  const calculateToilForDay = useCallback(async (): Promise<TOILSummary | null> => {
    try {
      // Set calculating state at the beginning
      if (isMountedRef.current) {
        setIsCalculating(true);
      }
      
      // Add circuit breaker for calculations
      const now = Date.now();
      if (calculationInProgressRef.current) {
        logger.debug('Skipping TOIL calculation - another one is in progress');
        return null;
      }
      
      // Reduce debounce period to make updates appear faster
      if (now - lastOperationTimeRef.current < 1000) {
        logger.debug('Skipping TOIL calculation due to rate limiting');
        return null;
      }
      
      // Mark calculation as in progress and update last calculation time
      calculationInProgressRef.current = true;
      lastOperationTimeRef.current = now;
      
      logger.debug(`calculateToilForDay called for date ${format(date, 'yyyy-MM-dd')}`);
      
      // Return early if missing required data or component unmounted
      if (!userId || !date || !isMountedRef.current) {
        logger.debug('Missing required data for TOIL calculation or component unmounted');
        
        if (isMountedRef.current) {
          setIsCalculating(false);
        }
        
        calculationInProgressRef.current = false;
        return null;
      }
      
      // Return early if no entries
      if (entries.length === 0) {
        logger.debug('No entries for TOIL calculation, returning zero summary');
        const zeroSummary = {
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        };
        
        if (isMountedRef.current) {
          setToilSummary(zeroSummary);
        }
        
        calculationInProgressRef.current = false;
        return zeroSummary;
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
      
      // Update internal state if component still mounted
      if (isMountedRef.current) {
        setToilSummary(summary);
        
        // Dispatch event to update other components
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

  // Trigger calculation (from useTOILTriggers)
  const triggerTOILCalculation = useCallback(async (): Promise<TOILSummary | null> => {
    logger.debug('Manually triggering TOIL calculation');
    
    try {
      // Notify that calculation is starting
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'starting',
        timestamp: new Date()
      });
      
      const result = await calculateToilForDay();
      
      // Notify that calculation is complete
      if (result) {
        unifiedTOILEventService.dispatchTOILSummaryEvent(result);
      }
      
      // Also publish the calculation completed event
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'completed',
        summary: result,
        timestamp: new Date()
      });
      
      logger.debug('Manual TOIL calculation complete');
      return result;
    } catch (error) {
      logger.error('Error during manual TOIL calculation:', error);
      
      // Notify about error
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      
      throw error;
    }
  }, [calculateToilForDay, userId, date]);

  // Refresh summary (from useTOILSummary)
  const refreshSummary = useCallback(() => {
    const now = Date.now();
    if (now - lastOperationTimeRef.current < 1000) {
      logger.debug('Skipping duplicate refresh due to debounce');
      return;
    }
    lastOperationTimeRef.current = now;
    
    logger.debug(`Refresh requested for ${userId}`);
    
    // Aggressive cache clearing for immediate feedback
    clearCacheForCurrentMonth(userId, date);
    setRefreshCounter(c => c + 1);
  }, [userId, date]);

  // Initialize TOIL summary when component mounts or user/date changes
  useEffect(() => {
    if (!userId || !date) return;
    loadSummary();
  }, [userId, date, loadSummary]);

  // Set up event listeners for TOIL updates
  useEffect(() => {
    // Create a unified handler using the factory function from the unified service
    const handleTOILUpdate = unifiedTOILEventService.createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          if (isMountedRef.current) {
            logger.debug('Received valid TOIL update:', data);
            setToilSummary(data);
            setIsLoading(false);
          }
        },
        onRefresh: refreshSummary,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    // Listen for DOM events
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    // Subscribe to EventBus events
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      if (data && typeof data === 'object' && data.userId === userId) {
        refreshSummary();
      }
    });

    // Special handler for the CALCULATED event
    const calculatedSubscription = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: any) => {
      logger.debug(`TOIL_EVENTS.CALCULATED received:`, data);
      if (data && data.userId === userId && data.requiresRefresh) {
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
    loadSummary();
  }, [loadSummary, refreshCounter]);

  // Debounced calculation when entries change
  useEffect(() => {
    if (!userId || !date || !autoRefresh) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // No calculation needed if we've already processed this date
    if (processedDatesRef.current.has(dateKey) && entries.length === entriesRef.current.length) {
      return;
    }
    
    logger.debug(`Entries changed (${entries.length} entries), debouncing TOIL calculation`);
    
    const timeoutId = setTimeout(() => {
      logger.debug('Debounce time elapsed, calculating TOIL');
      calculateToilForDay().then(() => {
        // Mark this date as processed
        processedDatesRef.current.add(dateKey);
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [userId, date, entries, calculateToilForDay, autoRefresh]);

  // Set up auto-refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    logger.debug(`Setting up auto-refresh interval (${refreshInterval}ms)`);
    
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refreshSummary();
      }
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshSummary]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug('useUnifiedTOIL hook unmounting');
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

/**
 * Mark deprecated hooks with JSDoc tags
 */
export default useUnifiedTOIL;
