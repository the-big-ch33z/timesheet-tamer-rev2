
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { toilService } from '@/utils/time/services/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { createTimeLogger } from '@/utils/time/errors';
import { DEBOUNCE_PERIOD } from '@/utils/time/services/toil/storage/constants';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { eventBus } from '@/utils/events/EventBus';

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
      // Use the toilService directly
      const result = toilService.getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      logger.debug(`Summary result:`, result);
      
      if (!result) {
        setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
        logger.debug(`No summary found, using default`);
      } else {
        setSummary(result);
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
    toilService.clearCache();
    setRefreshCounter(c => c + 1);
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSummary]);

  useEffect(() => {
    logger.debug(`Clearing cache for ${userId}`);
    try {
      toilService.clearCache();
    } catch (err) {
      logger.error(`Error clearing cache:`, err);
    }
  }, [userId, monthYear]);

  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      const data = event.detail;
      logger.debug(`TOIL update event received:`, data);
      
      const valid = data?.userId === userId && (!data.monthYear || data.monthYear === monthYear);
      if (valid) {
        logger.debug(`Valid update for current user and month`);
        if (typeof data.accrued === 'number') {
          setSummary({
            userId,
            monthYear: data.monthYear || monthYear,
            accrued: data.accrued,
            used: data.used,
            remaining: data.remaining
          });
          setIsLoading(false);
          logger.debug(`Updated summary from event data`);
        } else {
          logger.debug(`No accrued data, refreshing summary`);
          refreshSummary();
        }
      }
    };

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    logger.debug(`Added event listener for toil:summary-updated`);
    
    // Subscribe to both TOIL event types for more reliable updates
    const sub1 = timeEventsService.subscribe('toil-updated', data => {
      logger.debug(`toil-updated event received:`, data);
      if (data?.userId === userId) {
        logger.debug(`Refreshing based on toil-updated event`);
        refreshSummary();
      }
    });

    // Add a direct subscription to the centralized event bus as well
    const sub2 = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, data => {
      logger.debug(`TOIL_EVENTS.SUMMARY_UPDATED received:`, data);
      if (data?.userId === userId) {
        logger.debug(`Refreshing based on TOIL_EVENTS.SUMMARY_UPDATED`);
        refreshSummary();
      }
    });

    // Also subscribe to hours-updated events since they may affect TOIL
    const sub3 = timeEventsService.subscribe('hours-updated', data => {
      if (data?.userId === userId) {
        logger.debug(`TOIL summary refresh triggered by hours-updated event`);
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
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
