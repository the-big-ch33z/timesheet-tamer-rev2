
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { toilService, clearCacheForCurrentMonth } from '@/utils/time/services/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { createTimeLogger } from '@/utils/time/errors';
import { DEBOUNCE_PERIOD } from '@/utils/time/services/toil/storage/constants';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { eventBus } from '@/utils/events/EventBus';
import { createTOILUpdateHandler } from '@/utils/time/events/toilEventService';

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

// Debounce timestamp tracking
let lastOperationTime = 0;
// Event tracking for circuit breaker
let eventCount = 0;
let eventCountResetTimer: NodeJS.Timeout | null = null;

export const useTOILSummary = ({
  userId,
  date,
  monthOnly = true
}: UseTOILSummaryProps): UseTOILSummaryResult => {
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

    // Circuit breaker pattern
    const now = Date.now();
    if (updateAttemptsRef.current > 10 && now - lastUpdateTimeRef.current < 60000) {
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
      
      // Use selective cache clearing instead of aggressive clearing
      if (refreshCounter % 5 === 0) { // Only clear cache occasionally
        clearCacheForCurrentMonth(userId, date);
      }
      
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
        if (updateAttemptsRef.current > 10) {
          setTimeout(() => {
            updateAttemptsRef.current = 0;
          }, 60000);
        }
      }
    }
  }, [userId, monthYear, refreshCounter, date]);

  const refreshSummary = useCallback(() => {
    const now = Date.now();
    if (now - lastOperationTime < DEBOUNCE_PERIOD) {
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
    
    // Circuit breaker - skip if too many events
    if (eventCount > 10) {
      logger.warn(`Too many refresh events (${eventCount}), skipping this one`);
      return;
    }
    
    logger.debug(`Refresh requested for ${userId}`);
    
    // Selective cache clearing
    clearCacheForCurrentMonth(userId, date);
    setRefreshCounter(c => c + 1);
  }, [userId, date]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    
    // Set up a refresh interval to ensure we get updated data, but less frequently
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        logger.debug('Periodic refresh');
        setRefreshCounter(c => c + 1); // Just increment counter to trigger loadSummary
      }
    }, 30000); // Refresh every 30 seconds instead of 10
    
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
    // Create a unified handler using the factory function
    const handleTOILUpdate = createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          if (isMountedRef.current) {
            logger.debug('Received valid TOIL update:', data);
            setSummary(data);
            lastSummaryRef.current = data;
            setIsLoading(false);
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
    
    // Listen via timeEventsService but with throttling
    const sub1 = timeEventsService.subscribe('toil-updated', data => {
      // Skip if circuit breaker is active
      if (eventCount > 10) return;
      
      logger.debug(`toil-updated event received:`, data);
      if (data?.userId === userId) {
        logger.debug(`Refreshing based on toil-updated event`);
        refreshSummary();
      }
    });

    // Added debouncing to these event handlers
    const sub2 = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      // Skip if circuit breaker is active  
      if (eventCount > 10) return;
      
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      if (data && typeof data === 'object' && data.userId === userId) {
        const now = Date.now();
        if (now - lastOperationTime > DEBOUNCE_PERIOD) {
          logger.debug(`Refreshing based on TOIL_EVENTS.SUMMARY_UPDATED`);
          lastOperationTime = now;
          setRefreshCounter(c => c + 1);
        }
      }
    });

    // Reset event counters on unmount
    return () => {
      // Clean up all event listeners properly
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (sub1 && typeof sub1.unsubscribe === 'function') sub1.unsubscribe();
      if (typeof sub2 === 'function') sub2();
      logger.debug(`Removed event listeners`);
      
      eventCount = 0;
      if (eventCountResetTimer) {
        clearTimeout(eventCountResetTimer);
        eventCountResetTimer = null;
      }
    };
  }, [userId, monthYear, refreshSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
