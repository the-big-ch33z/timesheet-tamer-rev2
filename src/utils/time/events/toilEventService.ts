import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";
import React, { createContext, useContext, useEffect, useState } from "react";

const logger = createTimeLogger('TOILEventService');

// Event types for TOIL operations
export type TOILEventType = 
  | 'toil-calculated' 
  | 'toil-updated'
  | 'toil-consumed'
  | 'toil-error';

export interface TOILEvent {
  type: TOILEventType;
  data: any;
  timestamp: Date;
  userId?: string;
}

// Context for TOIL events
interface TOILEventContextType {
  dispatchTOILEvent: (event: Omit<TOILEvent, 'timestamp'>) => void;
  subscribe: (eventType: TOILEventType | 'all', callback: (event: TOILEvent) => void) => () => void;
  lastEvent: TOILEvent | null;
}

const TOILEventContext = createContext<TOILEventContextType | undefined>(undefined);

/**
 * Hook to access TOIL event context
 */
export const useTOILEvents = () => {
  const context = useContext(TOILEventContext);
  if (!context) {
    // Instead of throwing an error, return a default implementation
    console.warn('useTOILEvents called outside of TOILEventProvider, using fallback');
    return {
      dispatchTOILEvent: () => false,
      subscribe: () => () => {},
      lastEvent: null
    };
  }
  return context;
};

/**
 * Provider component for TOIL events
 */
export const TOILEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastEvent, setLastEvent] = useState<TOILEvent | null>(null);
  
  // Callback registry using a ref to avoid re-renders
  const callbacksRef = React.useRef<Map<TOILEventType | 'all', Set<(event: TOILEvent) => void>>>(new Map());
  
  // Dispatch TOIL event
  const dispatchTOILEvent = React.useCallback((event: Omit<TOILEvent, 'timestamp'>) => {
    try {
      const fullEvent = {
        ...event,
        timestamp: new Date()
      };
      
      logger.debug(`Dispatching TOIL event: ${event.type}`, event.data);
      
      // Update last event
      setLastEvent(fullEvent);
      
      // Notify event-specific callbacks
      const callbacks = callbacksRef.current.get(event.type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(fullEvent);
          } catch (error) {
            logger.error(`Error in TOIL event callback for ${event.type}:`, error);
          }
        });
      }
      
      // Notify 'all' event callbacks
      const allCallbacks = callbacksRef.current.get('all');
      if (allCallbacks) {
        allCallbacks.forEach(callback => {
          try {
            callback(fullEvent);
          } catch (error) {
            logger.error(`Error in TOIL event callback for 'all':`, error);
          }
        });
      }
      
      // Use the new centralized EventBus
      // Fixed: TypeScript error by properly handling the data type
      const eventData = event.data || {};
      eventBus.publish(TOIL_EVENTS.UPDATED, eventData);
      
      return true;
    } catch (error) {
      logger.error(`Error dispatching TOIL event:`, error);
      return false;
    }
  }, []);
  
  // Subscribe to TOIL events
  const subscribe = React.useCallback((eventType: TOILEventType | 'all', callback: (event: TOILEvent) => void) => {
    if (!callbacksRef.current.has(eventType)) {
      callbacksRef.current.set(eventType, new Set());
    }
    
    const callbacks = callbacksRef.current.get(eventType)!;
    callbacks.add(callback);
    
    logger.debug(`Subscribed to TOIL event: ${eventType}`);
    
    // Return unsubscribe function
    return () => {
      const callbacks = callbacksRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          callbacksRef.current.delete(eventType);
        }
      }
      logger.debug(`Unsubscribed from TOIL event: ${eventType}`);
    };
  }, []);
  
  // Subscribe to eventBus events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(TOIL_EVENTS.UPDATED, (data) => {
      if (!data) return;
      
      // Fixed: TypeScript error by providing a fallback for userId
      const userId = typeof data === 'object' && data !== null && 'userId' in data 
        ? String(data.userId) 
        : undefined;
      
      setLastEvent({
        type: 'toil-updated',
        data,
        timestamp: new Date(),
        userId
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Context value
  const contextValue = React.useMemo(() => ({
    dispatchTOILEvent,
    subscribe,
    lastEvent
  }), [dispatchTOILEvent, subscribe, lastEvent]);
  
  return React.createElement(
    TOILEventContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Helper function to dispatch TOIL summary update events
 * Integrates with legacy event system
 */
export const dispatchTOILSummaryEvent = (summary: TOILSummary) => {
  // Use the central event bus directly
  eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, summary);
  logger.debug('TOIL summary update dispatched:', summary);
  return true;
};

/**
 * Factory function that creates a standardized TOIL update event handler
 * This unifies the event handling logic across different components
 * 
 * @param userId The user ID to filter events for
 * @param monthYear Optional month/year to filter events for
 * @param callbacks Object containing callback functions
 * @returns A handler function for TOIL update events
 */
export const createTOILUpdateHandler = (
  userId: string,
  monthYear?: string,
  callbacks?: {
    onValidUpdate?: (data: TOILSummary) => void;
    onRefresh?: () => void;
    onLog?: (message: string, data?: any) => void;
  }
) => {
  const { onValidUpdate, onRefresh, onLog } = callbacks || {};
  
  // Return the actual event handler function
  return (event: Event) => {
    try {
      // Type guard and conversion
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      
      // Log if callback provided
      if (onLog) {
        onLog(`TOIL update event received:`, data);
      } else {
        logger.debug(`TOIL update event received:`, data);
      }
      
      // Check if this event is relevant for this component
      const isRelevantUser = data?.userId === userId;
      const isRelevantMonth = !monthYear || !data.monthYear || data.monthYear === monthYear;
      
      if (isRelevantUser && isRelevantMonth) {
        if (onLog) {
          onLog(`Valid update for current user ${userId} and month ${monthYear || 'any'}`);
        } else {
          logger.debug(`Valid update for current user ${userId} and month ${monthYear || 'any'}`);
        }
        
        // If we have accrued data, we can update directly
        if (typeof data.accrued === 'number' && onValidUpdate) {
          const summary: TOILSummary = {
            userId,
            monthYear: data.monthYear || monthYear || '',
            accrued: data.accrued,
            used: data.used,
            remaining: data.remaining
          };
          
          onValidUpdate(summary);
          
          if (onLog) {
            onLog(`Updated summary from event data`, summary);
          } else {
            logger.debug(`Updated summary from event data`, summary);
          }
        } 
        // Otherwise trigger a refresh
        else if (onRefresh) {
          if (onLog) {
            onLog(`No accrued data, refreshing summary`);
          } else {
            logger.debug(`No accrued data, refreshing summary`);
          }
          
          onRefresh();
        }
      }
    } catch (error) {
      logger.error(`Error handling TOIL update event:`, error);
    }
  };
};

// Export the enhanced dispatch function to replace the original one
export { dispatchTOILSummaryEvent as dispatchTOILEvent };
