
import React, { useState, useCallback } from 'react';
import { TOILEvent, TOILEventType, TOILEventContextType } from './types';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILEventProvider');

/**
 * Context for TOIL events
 */
const TOILEventContext = createContext<TOILEventContextType | undefined>(undefined);

/**
 * Provider component for TOIL events
 */
export const TOILEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastEvent, setLastEvent] = useState<TOILEvent | null>(null);
  
  // Callback registry using a ref to avoid re-renders
  const callbacksRef = React.useRef<Map<TOILEventType | 'all', Set<(event: TOILEvent) => void>>>(new Map());
  
  // Dispatch TOIL event
  const dispatchTOILEvent = useCallback((event: Omit<TOILEvent, 'timestamp'>) => {
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
      
      // Use the centralized EventBus
      const eventData = event.data || {};
      eventBus.publish(TOIL_EVENTS.UPDATED, eventData);
      
      return true;
    } catch (error) {
      logger.error(`Error dispatching TOIL event:`, error);
      return false;
    }
  }, []);
  
  // Subscribe to TOIL events
  const subscribe = useCallback((eventType: TOILEventType | 'all', callback: (event: TOILEvent) => void) => {
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
  React.useEffect(() => {
    const unsubscribe = eventBus.subscribe(TOIL_EVENTS.UPDATED, (data) => {
      if (!data) return;
      
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
  
  return (
    <TOILEventContext.Provider value={contextValue}>
      {children}
    </TOILEventContext.Provider>
  );
};

export { TOILEventContext };
