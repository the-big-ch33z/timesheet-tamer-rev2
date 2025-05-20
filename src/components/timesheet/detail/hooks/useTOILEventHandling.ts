
import { useCallback, useEffect, useRef } from "react";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { useTOILEvents } from "@/utils/time/events/toil";
import { TOILEventContextType } from "@/utils/time/events/toil/types";
import { unifiedTOILEventService } from "@/utils/time/services/toil/unifiedEventService";

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
  
  // Subscribe to TOIL updates using the unified service
  useEffect(() => {
    if (!onRefreshRequest) return;
    
    // Create a handler using the unified service
    const toilUpdateHandler = unifiedTOILEventService.createTOILUpdateHandler(
      '', // Empty userId to handle all users
      '',  // Empty monthYear to handle all months
      {
        onRefresh: handleRefresh,
        onLog: (message) => {
          logger.debug(`[TOILEventHandling] ${message}`);
        }
      }
    );
    
    // Subscribe to all possible event channels for maximum compatibility
    
    // 1. Legacy DOM events
    window.addEventListener('toil:summary-updated', toilUpdateHandler as EventListener);
    window.addEventListener('toil:updated', toilUpdateHandler as EventListener);
    
    // 2. EventBus centralized events
    const sub1 = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, () => {
      logger.debug('TOIL_EVENTS.SUMMARY_UPDATED received in TOILSummaryCard');
      handleRefresh();
    });
    
    const sub2 = eventBus.subscribe(TOIL_EVENTS.UPDATED, () => {
      logger.debug('TOIL_EVENTS.UPDATED received in TOILSummaryCard');
      handleRefresh();
    });
    
    const sub3 = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: any) => {
      if (data?.requiresRefresh) {
        logger.debug('TOIL_EVENTS.CALCULATED with requiresRefresh received');
        handleRefresh();
      }
    });
    
    // Subscribe to old context if available
    const contextUnsubscribe = toilEvents.current ? 
      toilEvents.current.subscribe('toil-updated', () => {
        logger.debug('Legacy context toil-updated event received');
        handleRefresh();
      }) : 
      () => {};
    
    return () => {
      // Clean up all subscriptions
      window.removeEventListener('toil:summary-updated', toilUpdateHandler as EventListener);
      window.removeEventListener('toil:updated', toilUpdateHandler as EventListener);
      if (typeof sub1 === 'function') sub1();
      if (typeof sub2 === 'function') sub2();
      if (typeof sub3 === 'function') sub3();
      contextUnsubscribe();
    };
  }, [handleRefresh]);

  return { handleRefresh };
};
