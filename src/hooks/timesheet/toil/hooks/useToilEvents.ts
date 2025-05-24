
import { useEffect, useCallback } from 'react';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';
import { isRelevantToilEvent } from '../utils/toilEventUtils';
import { TOILSummary } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useToilEvents');

export interface UseToilEventsProps {
  userId: string;
  monthYear: string;
  setToilSummary: (summary: TOILSummary | null) => void;
  setIsLoading: (loading: boolean) => void;
  refreshSummary: () => void;
  isTestMode?: boolean;
}

/**
 * Hook for managing TOIL event subscriptions with optimized debouncing
 */
export function useToilEvents({
  userId,
  monthYear,
  setToilSummary,
  setIsLoading,
  refreshSummary,
  isTestMode = false
}: UseToilEventsProps): void {
  // Create a debounced refresh function to prevent excessive calls
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      refreshSummary();
    }, 300); // 300ms debounce for refresh operations
    
    return () => clearTimeout(timeoutId);
  }, [refreshSummary]);

  // Set up event listeners
  useEffect(() => {
    if (isTestMode) return;

    const handleTOILUpdate = unifiedTOILEventService.createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          logger.debug('Received valid TOIL update:', data);
          setToilSummary(data);
          setIsLoading(false);
        },
        onRefresh: debouncedRefresh,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    // Subscribe to primary events with consolidated handling
    const summarySubscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL summary update for ${userId} in ${monthYear}`);
        debouncedRefresh();
      }
    });

    const calculatedSubscription = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: TOILEventData) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL calculation for ${userId} in ${monthYear}`);
        debouncedRefresh();
      }
    });

    // Remove the redundant UPDATED subscription to reduce event volume
    // The SUMMARY_UPDATED and CALCULATED events cover all necessary cases

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof summarySubscription === 'function') summarySubscription();
      if (typeof calculatedSubscription === 'function') calculatedSubscription();
    };
  }, [userId, monthYear, debouncedRefresh, setToilSummary, setIsLoading, isTestMode]);
}
