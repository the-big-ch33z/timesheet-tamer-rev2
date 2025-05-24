
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
 * Hook for managing TOIL event subscriptions
 */
export function useToilEvents({
  userId,
  monthYear,
  setToilSummary,
  setIsLoading,
  refreshSummary,
  isTestMode = false
}: UseToilEventsProps): void {
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
        onRefresh: refreshSummary,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL update for ${userId} in ${monthYear}`);
        refreshSummary();
      }
    });

    const calculatedSubscription = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: TOILEventData) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL calculation for ${userId} in ${monthYear}`);
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof subscription === 'function') subscription();
      if (typeof calculatedSubscription === 'function') calculatedSubscription();
    };
  }, [userId, monthYear, refreshSummary, setToilSummary, setIsLoading, isTestMode]);
}
