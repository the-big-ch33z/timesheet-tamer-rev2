
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
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
    throw new Error('useTOILEvents must be used within a TOILEventProvider');
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
      
      // Also dispatch through timeEventsService for system-wide integration
      timeEventsService.publish(event.type as any, event.data);
      
      // Dispatch DOM event for backward compatibility
      const domEvent = new CustomEvent(`toil:${event.type}`, { detail: event.data });
      window.dispatchEvent(domEvent);
      
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
  
  // Subscribe to timeEventsService events
  useEffect(() => {
    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      if (!data) return;
      
      setLastEvent({
        type: 'toil-updated',
        data,
        timestamp: new Date(),
        userId: data.userId
      });
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Context value
  const value: TOILEventContextType = {
    dispatchTOILEvent,
    subscribe,
    lastEvent
  };
  
  return React.createElement(
    TOILEventContext.Provider,
    { value },
    children
  );
};

/**
 * Helper function to dispatch TOIL summary update events
 * Integrates with legacy event system
 */
export const dispatchTOILSummaryEvent = (summary: TOILSummary) => {
  // First try to use the context if available
  try {
    // This will only work if inside provider, otherwise fall back to direct dispatch
    const { dispatchTOILEvent } = useTOILEvents();
    dispatchTOILEvent({
      type: 'toil-updated',
      data: summary,
      userId: summary.userId
    });
    return true;
  } catch (error) {
    // Fall back to direct dispatch methods
    logger.debug('Context not available, using direct dispatch methods');
    
    // Dispatch DOM event for backward compatibility
    const event = new CustomEvent('toil:summary-updated', { detail: summary });
    window.dispatchEvent(event);
    
    // Dispatch through timeEventsService
    timeEventsService.publish('toil-updated', {
      userId: summary.userId,
      monthYear: summary.monthYear,
      summary
    });
    
    logger.debug('TOIL summary update events dispatched:', summary);
    return true;
  }
};

// Export the enhanced dispatch function to replace the original one
export { dispatchTOILSummaryEvent as dispatchTOILEvent };
