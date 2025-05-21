import { useCallback, useEffect, useRef } from "react";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TIME_ENTRY_EVENTS } from '@/utils/events/eventTypes';
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
  const lastRefreshRef = useRef<number>(0);
  const refreshPendingRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  try {
    toilEvents.current = useTOILEvents();
  } catch (e) {
    // Context not available, continue without it
    logger.debug('TOIL Events context not available');
  }
  
  // Debounced refresh implementation with shorter delay
  const debouncedRefresh = useCallback(() => {
    if (!onRefreshRequest) return;
    
    const now = Date.now();
    
    // Always refresh if it's been more than 500ms since last refresh
    if (now - lastRefreshRef.current > 500) {
      logger.debug('Immediate refresh - sufficient time elapsed since last refresh');
      lastRefreshRef.current = now;
      onRefreshRequest();
      refreshPendingRef.current = false;
      return;
    }
    
    // Otherwise set a short debounce of 100ms
    if (refreshPendingRef.current) {
      logger.debug('Refresh already pending, skipping duplicate request');
      return;
    }
    
    refreshPendingRef.current = true;
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Set a new timeout with shorter delay for more responsiveness
    refreshTimeoutRef.current = setTimeout(() => {
      logger.debug('Executing debounced refresh (100ms)');
      lastRefreshRef.current = Date.now();
      onRefreshRequest?.();
      refreshPendingRef.current = false;
      refreshTimeoutRef.current = null;
    }, 100); // Reduced from typical 300ms to 100ms for more responsiveness
  }, [onRefreshRequest]);
  
  // Handle refresh request
  const handleRefresh = useCallback(() => {
    logger.debug('TOILSummaryCard requesting refresh');
    debouncedRefresh();
  }, [debouncedRefresh]);
  
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
    const sub1 = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data) => {
      logger.debug('TOIL_EVENTS.SUMMARY_UPDATED received in TOILSummaryCard', data);
      handleRefresh();
    });
    
    const sub2 = eventBus.subscribe(TOIL_EVENTS.UPDATED, () => {
      logger.debug('TOIL_EVENTS.UPDATED received in TOILSummaryCard');
      handleRefresh();
    });
    
    const sub3 = eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: any) => {
      logger.debug('TOIL_EVENTS.CALCULATED received in TOILSummaryCard', data);
      handleRefresh();
    });
    
    // NEW: Subscribe to entry deletion events to handle TOIL updates after deletion
    const sub4 = eventBus.subscribe(TIME_ENTRY_EVENTS.DELETED, (data) => {
      logger.debug('TIME_ENTRY_EVENTS.DELETED received in TOILSummaryCard', data);
      // Short delay to ensure TOIL calculations complete first
      setTimeout(handleRefresh, 50);
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
      if (typeof sub4 === 'function') sub4();
      contextUnsubscribe();
      
      // Clear any pending timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [handleRefresh]);

  return { handleRefresh };
};
