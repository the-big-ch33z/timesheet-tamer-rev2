
import { useCallback, useEffect, useRef } from "react";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { useTOILEvents } from "@/utils/time/events/toil";
import { TOILEventContextType } from "@/utils/time/events/toil/types";

const logger = createTimeLogger('useTOILEventHandling');

/**
 * Custom hook to handle TOIL events and refreshes
 */
export const useTOILEventHandling = (onRefreshRequest?: () => void) => {
  // Subscribe to TOIL events if available
  const toilEvents = useRef<TOILEventContextType | null>(null);
  
  try {
    toilEvents.current = useTOILEvents();
  } catch (e) {
    // Context not available, continue without it
    logger.debug('TOIL Events context not available');
  }
  
  // Handle refresh request
  const handleRefresh = useCallback(() => {
    logger.debug('TOILSummaryCard requesting refresh');
    if (onRefreshRequest) {
      onRefreshRequest();
    }
  }, [onRefreshRequest]);
  
  // Subscribe to TOIL updates
  useEffect(() => {
    if (!toilEvents.current) return;
    
    const unsubscribe = toilEvents.current.subscribe('toil-updated', (event) => {
      logger.debug('TOIL update event received in TOILSummaryCard:', event);
      handleRefresh();
    });
    
    return () => {
      unsubscribe();
    };
  }, [handleRefresh]);
  
  // Subscribe to centralized event bus for TOIL updates
  useEffect(() => {
    if (!onRefreshRequest) return;
    
    const unsubscribe = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, () => {
      logger.debug('TOIL_EVENTS.SUMMARY_UPDATED received in TOILSummaryCard');
      handleRefresh();
    });
    
    // Also subscribe to the updated event
    const unsubscribe2 = eventBus.subscribe(TOIL_EVENTS.UPDATED, () => {
      logger.debug('TOIL_EVENTS.UPDATED received in TOILSummaryCard');
      handleRefresh();
    });
    
    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [onRefreshRequest, handleRefresh]);

  return { handleRefresh };
};
