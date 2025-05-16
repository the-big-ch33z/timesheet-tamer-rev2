
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { toilService, clearCache } from '@/utils/time/services/toil';
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

// Use imported debounce period
let lastOperationTime = 0;

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

  const loadSummary = useCallback(() => {
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug(`Loading summary for ${userId} in ${monthYear}`);
      
      // Aggressively clear cache before loading
      clearCache();
      
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
      }
    }
  }, [userId, monthYear, refreshCounter]);

  const refreshSummary = useCallback(() => {
    const now = Date.now();
    if (now - lastOperationTime < DEBOUNCE_PERIOD) {
      logger.debug('Skipping duplicate refresh due to debounce');
      return;
    }
    lastOperationTime = now;
    
    logger.debug(`Refresh requested for ${userId}`);
    // Clear cache before refreshing to ensure we get fresh data
    clearCache();
    setRefreshCounter(c => c + 1);
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    
    // Set up a refresh interval to ensure we get updated data
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        logger.debug('Periodic refresh');
        refreshSummary();
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      isMountedRef.current = false;
      clearInterval(refreshInterval);
    };
  }, [loadSummary, refreshSummary]);

  useEffect(() => {
    logger.debug(`Clearing cache for ${userId}`);
    try {
      clearCache();
    } catch (err) {
      logger.error(`Error clearing cache:`, err);
    }
  }, [userId, monthYear]);

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
    
    // Listen via timeEventsService
    const sub1 = timeEventsService.subscribe('toil-updated', data => {
      logger.debug(`toil-updated event received:`, data);
      if (data?.userId === userId) {
        logger.debug(`Refreshing based on toil-updated event`);
        refreshSummary();
      }
    });

    // Listen via centralized event bus
    const sub2 = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      if (data && typeof data === 'object' && data.userId === userId) {
        logger.debug(`Refreshing based on TOIL_EVENTS.SUMMARY_UPDATED`);
        refreshSummary();
      }
    });

    // Also listen for hours-updated events
    const sub3 = timeEventsService.subscribe('hours-updated', data => {
      if (data?.userId === userId) {
        logger.debug(`TOIL summary refresh triggered by hours-updated event`);
        refreshSummary();
      }
    });

    // Special listening for any TOIL-related events
    const sub4 = eventBus.subscribe(TOIL_EVENTS.UPDATED, () => {
      logger.debug('General TOIL update detected, refreshing');
      refreshSummary();
    });

    return () => {
      // Clean up all event listeners properly
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (sub1 && typeof sub1.unsubscribe === 'function') sub1.unsubscribe();
      if (typeof sub2 === 'function') sub2();
      if (sub3 && typeof sub3.unsubscribe === 'function') sub3.unsubscribe();
      if (typeof sub4 === 'function') sub4();
      logger.debug(`Removed event listeners`);
    };
  }, [userId, monthYear, refreshSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
