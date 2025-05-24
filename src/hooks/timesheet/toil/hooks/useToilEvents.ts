
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
 * Hook for managing TOIL event subscriptions with very conservative debouncing
 */
export function useToilEvents({
  userId,
  monthYear,
  setToilSummary,
  setIsLoading,
  refreshSummary,
  isTestMode = false
}: UseToilEventsProps): void {
  // Create a very conservative refresh function to prevent cascading
  const conservativeRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      logger.debug('Conservative TOIL refresh triggered');
      refreshSummary();
    }, 10000); // Very long 10 second delay
    
    return () => clearTimeout(timeoutId);
  }, [refreshSummary]);

  // Set up minimal event listeners to prevent cascades
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
        onRefresh: conservativeRefresh,
        onLog: (message, data) => {
          logger.debug(message, data);
        }
      }
    );

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    // Subscribe ONLY to summary updates to reduce event volume
    const summarySubscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL summary update for ${userId} in ${monthYear}`);
        // Only refresh if this is a genuine update, not a cascading event
        if (!data.source?.includes('cascade') && !data.source?.includes('event')) {
          conservativeRefresh();
        }
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof summarySubscription === 'function') summarySubscription();
    };
  }, [userId, monthYear, conservativeRefresh, setToilSummary, setIsLoading, isTestMode]);
}
