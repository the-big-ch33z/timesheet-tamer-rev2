
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
 * Hook for managing TOIL event subscriptions with much longer debouncing to prevent cascades
 */
export function useToilEvents({
  userId,
  monthYear,
  setToilSummary,
  setIsLoading,
  refreshSummary,
  isTestMode = false
}: UseToilEventsProps): void {
  // Create a heavily debounced refresh function to prevent cascading
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      refreshSummary();
    }, 2000); // Increased from 300ms to 2000ms for much better stability
    
    return () => clearTimeout(timeoutId);
  }, [refreshSummary]);

  // Set up event listeners with reduced frequency
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
    
    // Subscribe ONLY to the most essential events to reduce cascade potential
    const summarySubscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (isRelevantToilEvent(data, userId, monthYear)) {
        logger.debug(`Matched TOIL summary update for ${userId} in ${monthYear}`);
        // Only refresh if this is a genuine update, not a cascading event
        if (!data.source?.includes('cascade')) {
          debouncedRefresh();
        }
      }
    });

    // Remove calculated subscription to reduce event volume - summary updates are sufficient
    // The original CALCULATED subscription was causing too many cascade events

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      if (typeof summarySubscription === 'function') summarySubscription();
    };
  }, [userId, monthYear, debouncedRefresh, setToilSummary, setIsLoading, isTestMode]);
}
