import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { toilService, clearCacheForCurrentMonth } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { eventBus } from '@/utils/events/EventBus';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';

const logger = createTimeLogger('useTOILSummary');

export interface UseTOILSummaryProps {
  userId: string;
  date: Date;
  monthOnly?: boolean;
}

export interface UseTOILSummaryResult {
  summary: TOILSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshSummary: () => void;
}

// Reduce debounce period for more responsive updates
const REDUCED_DEBOUNCE_PERIOD = 100; // ms

// Debounce timestamp tracking
let lastOperationTime = 0;
// Event tracking for circuit breaker
let eventCount = 0;
let eventCountResetTimer: NodeJS.Timeout | null = null;

/**
 * @deprecated Use useUnifiedTOIL from '@/hooks/timesheet/toil/useUnifiedTOIL' instead
 */
export const useTOILSummary = ({
  userId,
  date,
  monthOnly = true
}: UseTOILSummaryProps): UseTOILSummaryResult => {
  logger.debug('useTOILSummary is deprecated. Use useUnifiedTOIL instead');

  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = format(date, 'yyyy-MM');
  
  // Store last loaded summary for comparison
  const lastSummaryRef = useRef<TOILSummary | null>(null);

  // Track update attempts to implement circuit breaker
  const updateAttemptsRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  const loadSummary = useCallback(() => {
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    // More permissive circuit breaker 
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
      clearCacheForCurrentMonth(userId, date);
      
      // Use the toilService directly
      const result = toilService.getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      logger.debug(`Summary result:`, result);
      
      // Check if the summary has changed
      const hasChanged = !lastSummaryRef.current || 
                         !result || 
                         lastSummaryRef.current.accrued !== result.accrued ||
                         lastSummaryRef.current.used !== result.used || 
                         lastSummaryRef.current.remaining !== result.remaining;
      
      if (!result) {
        const defaultSummary = { userId, monthYear, accrued: 0, used: 0, remaining: 0 };
        setSummary(defaultSummary);
        lastSummaryRef.current = defaultSummary;
        logger.debug(`No summary found, using default`);
      } else {
        setSummary(result);
        lastSummaryRef.current = result;
        
        if (hasChanged) {
          logger.debug(`Summary changed: ${JSON.stringify(result)}`);
          
          // If summary changed, dispatch an event to update the calendar
          eventBus.publish(TOIL_EVENTS.CALCULATED, {
            userId: userId,
            date: date,
            status: 'completed',
            requiresRefresh: true
          }, { debounce: 0 });
        }
      }
    } catch (err) {
      logger.error(`Error getting summary:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
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
  }, [userId, monthYear, date]);

  const refreshSummary = useCallback(() => {
    const now = Date.now();
    if (now - lastOperationTime < REDUCED_DEBOUNCE_PERIOD) {
      logger.debug('Skipping duplicate refresh due to debounce');
      return;
    }
    lastOperationTime = now;
    
    // Increment event count and implement circuit breaker
    eventCount++;
    
    // Reset event count after some time
    if (eventCountResetTimer) clearTimeout(eventCountResetTimer);
    eventCountResetTimer = setTimeout(() => {
      eventCount = 0;
      eventCountResetTimer = null;
    }, 10000);
    
    // More permissive circuit breaker - allow more events
    if (eventCount > 20) {
      logger.warn(`Too many refresh events (${eventCount}), skipping this one`);
      return;
    }
    
    logger.debug(`Refresh requested for ${userId}`);
    
    // Aggressive cache clearing for immediate feedback
    clearCacheForCurrentMonth(userId, date);
    setRefreshCounter(c => c + 1);
  }, [userId, date]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    
    // Set up a refresh interval to ensure we get updated data, more frequently
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        logger.debug('Periodic refresh');
        setRefreshCounter(c => c + 1); // Just increment counter to trigger loadSummary
      }
    }, 10000); // Refresh every 10 seconds for more responsive updates
    
    return () => {
      isMountedRef.current = false;
      clearInterval(refreshInterval);
    };
  }, [loadSummary]);

  useEffect(() => {
    // Clear any existing reset timer when component unmounts
    return () => {
      if (eventCountResetTimer) {
        clearTimeout(eventCountResetTimer);
        eventCountResetTimer = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userId && date) {
      logger.debug(`Clearing cache for ${userId}`);
      clearCacheForCurrentMonth(userId, date);
    }
  }, [userId, monthYear, date]);

  useEffect(() => {
    // Create a unified handler using the factory function from the unified service
    const handleTOILUpdate = unifiedTOILEventService.createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          if (isMountedRef.current) {
            logger.debug('Received valid TOIL update:', data);
            setSummary(data);
            lastSummaryRef.current = data;
            setIsLoading(false);
            
            // Trigger calendar refresh when summary is updated
            eventBus.publish(TOIL_EVENTS.CALCULATED, {
              userId: userId,
              date: date,
              status: 'completed',
              requiresRefresh: true
            }, { debounce: 0 });
          }
        },
        onRefresh: refreshSummary,
        onLog: (message, data) => {
          if (isMountedRef.current) {
            logger.debug(message, data);
          }
        }
      }
    );

    // Listen for DOM events
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    logger.debug(`Added event listener for toil:summary-updated`);
    
    // Subscribe to EventBus events
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      // Skip if circuit breaker is active
      if (eventCount > 20) return;
      
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      if (data && typeof data === 'object' && data.userId === userId) {
        const now = Date.now();
        if (now - lastOperationTime > REDUCED_DEBOUNCE_PERIOD) {
          logger.debug(`Refreshing based on TOIL_EVENTS.SUMMARY_UPDATED`);
          lastOperationTime = now;
          setRefreshCounter(c => c + 1);
        }
      }
    });

    // Special handler for the CALCULATED event
    const sub3 = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: any) => {
      if (eventCount > 20) return;
      
      logger.debug(`TOIL_EVENTS.CALCULATED received:`, data);
      if (data && data.userId === userId && data.requiresRefresh) {
        const now = Date.now();
        if (now - lastOperationTime > REDUCED_DEBOUNCE_PERIOD) {
          logger.debug(`Refreshing based on TOIL_EVENTS.CALCULATED`);
          lastOperationTime = now;
          setRefreshCounter(c => c + 1);
        }
      }
    });

    // Reset event counters on unmount
    return () => {
      // Clean up all event listeners properly
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof subscription === 'function') subscription();
      if (typeof sub3 === 'function') sub3();
      logger.debug(`Removed event listeners`);
      
      eventCount = 0;
      if (eventCountResetTimer) {
        clearTimeout(eventCountResetTimer);
        eventCountResetTimer = null;
      }
    };
  }, [userId, monthYear, refreshSummary, date]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshCounter]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
