
/**
 * Enhanced event service for timesheet-related events with improved type safety
 */

type TimeEventType = 
  | 'entry-created' 
  | 'entry-updated' 
  | 'entry-deleted' 
  | 'hours-updated' 
  | 'hours-reset'
  | 'work-hours-updated'
  | 'work-hours-reset'
  | 'work-hours-cleared'
  | 'schedules-updated'
  | 'user-schedules-updated'
  | 'user-schedule-changed'
  | 'toil-calculated'
  | 'toil-updated'
  | 'timesheet-entry-saved'
  | 'timesheet-day-changed'
  | 'timesheet-month-changed';

// Subscription with proper cleanup
interface Subscription {
  unsubscribe: () => void;
}

// Event handler type
type EventHandler = (data: any) => void;

// Event listeners storage
const eventListeners = new Map<TimeEventType, Set<EventHandler>>();

// Debounce + batch tracking per handler, per event
const eventBatchTimeouts = new WeakMap<EventHandler, Map<string, number>>();
const eventBatchQueues = new WeakMap<EventHandler, Map<string, any>>();
// Key: eventType-eventKey, Value: setTimeout id
const DEBOUNCE_THRESHOLD = 200; // ms

// Track event dispatch history for debugging
const eventHistory: Array<{type: string, time: number, data: any}> = [];
const MAX_EVENT_HISTORY = 50;

// Helper for unique event key for batching
function getEventKey(eventType: TimeEventType, data: any) {
  return `${eventType}-${data?.id || data?.userId || data?.date || ''}`;
}

/**
 * Subscribe to a time event
 * Handlers for identical events within batching window (DEBOUNCE_THRESHOLD) will only be called once.
 */
const subscribe = (eventType: TimeEventType, handler: EventHandler): Subscription => {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  
  const handlers = eventListeners.get(eventType)!;
  handlers.add(handler);

  // Per-handler debounced batch logic
  if (!eventBatchTimeouts.has(handler)) {
    eventBatchTimeouts.set(handler, new Map());
    eventBatchQueues.set(handler, new Map());
  }

  // Log successful subscription
  console.debug(`[TimeEvents] Subscribed to '${eventType}' events. Active listeners: ${handlers.size}`);

  // Cleanup logic
  return {
    unsubscribe: () => {
      if (eventListeners.has(eventType)) {
        const handlers = eventListeners.get(eventType)!;
        handlers.delete(handler);
        // Also clear batching if nothing is listening anymore
        if (handlers.size === 0) {
          eventListeners.delete(eventType);
        }
        
        console.debug(`[TimeEvents] Unsubscribed from '${eventType}' events. Remaining listeners: ${handlers.size}`);
      }
      // Clean up batching timeouts and queues for this handler
      const timeouts = eventBatchTimeouts.get(handler);
      if (timeouts) {
        for (const [, timeoutId] of timeouts.entries()) {
          clearTimeout(timeoutId as any);
        }
        eventBatchTimeouts.delete(handler);
      }
      if (eventBatchQueues.has(handler)) {
        eventBatchQueues.delete(handler);
      }
    }
  };
};

/**
 * Publish a time event with improved batching protection.
 * For each (handler, eventType, eventKey), only one call will be executed in DEBOUNCE_THRESHOLD ms window.
 */
const publish = (eventType: TimeEventType, data: any = {}): boolean => {
  const eventKey = getEventKey(eventType, data);
  const now = Date.now();
  
  // Record in history for debugging
  eventHistory.unshift({ type: eventType, time: now, data });
  if (eventHistory.length > MAX_EVENT_HISTORY) {
    eventHistory.pop();
  }
  
  const handlers = eventListeners.get(eventType);
  const handlerCount = handlers?.size || 0;

  console.debug(`[TimeEvents] Publishing '${eventType}' event. Handlers: ${handlerCount}`, data);

  if (!handlerCount) {
    // No handler, fire DOM event for legacy/other listeners
    try {
      const event = new CustomEvent(eventType, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`[TimeEvents] Error dispatching DOM event for ${eventType}:`, error);
    }
    return true;
  }

  try {
    handlers!.forEach(handler => {
      // Per-handler batching logic
      const timeouts = eventBatchTimeouts.get(handler);
      const queues = eventBatchQueues.get(handler);
      if (timeouts && queues) {
        if (timeouts.has(eventKey)) {
          // Already scheduled, replace queued data (to pass up-to-date last object)
          queues.set(eventKey, data);
          console.debug(`[TimeEvents] Event '${eventType}' debounced, updated queue`);
        } else {
          queues.set(eventKey, data);
          // Schedule uniquely for this handler-eventKey pair
          const timeoutId = setTimeout(() => {
            try {
              const mostRecentData = queues.get(eventKey);
              console.debug(`[TimeEvents] Executing handler for '${eventType}' after debounce`);
              handler(mostRecentData);
            } catch(e) {
              console.error(`[TimeEvents] Error in batched event handler for ${eventType}:`, e);
            } finally {
              timeouts.delete(eventKey);
              queues.delete(eventKey);
            }
          }, DEBOUNCE_THRESHOLD);
          timeouts.set(eventKey, timeoutId as any);
        }
      } else {
        console.debug(`[TimeEvents] Direct execution of handler for '${eventType}'`);
        handler(data); // Fallback: call immediately if batching broke
      }
    });

    // Still dispatch legacy DOM event for compatibility
    try {
      const event = new CustomEvent(eventType, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`[TimeEvents] Error dispatching DOM event for ${eventType}:`, error);
    }
    
    return true;
  } catch (error) {
    console.error(`[TimeEvents] Error publishing ${eventType}:`, error);
    return false;
  }
};

/**
 * Get recent event history for debugging
 */
const getEventHistory = () => [...eventHistory];

/**
 * Clear all event listeners for cleanup
 */
const clearAllListeners = (): void => {
  // Save current set of handlers before clearing
  const handlersSet: Set<EventHandler> = new Set();
  eventListeners.forEach((handlers) => {
    handlers.forEach((handler) => {
      handlersSet.add(handler);
    });
  });

  // Clear all timeouts and queues for each handler
  handlersSet.forEach((handler) => {
    const timeouts = eventBatchTimeouts.get(handler);
    if (timeouts) {
      for (const [, timeoutId] of timeouts.entries()) {
        clearTimeout(timeoutId as any);
      }
      eventBatchTimeouts.delete(handler);
    }
    eventBatchQueues.delete(handler);
  });

  // Finally, clear the eventListeners map
  eventListeners.clear();
  console.debug('[TimeEvents] All event listeners cleared');
};

export const timeEventsService = {
  subscribe,
  publish,
  getEventHistory,
  clearAllListeners
};
