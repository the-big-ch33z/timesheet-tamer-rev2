
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

// Debounce storage to prevent event flooding
const recentEvents = new Map<string, number>();
const DEBOUNCE_THRESHOLD = 200; // milliseconds

/**
 * Subscribe to a time event
 */
const subscribe = (eventType: TimeEventType, handler: EventHandler): Subscription => {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  
  const handlers = eventListeners.get(eventType)!;
  handlers.add(handler);
  
  // Return an object with an unsubscribe method
  return {
    unsubscribe: () => {
      if (eventListeners.has(eventType)) {
        const handlers = eventListeners.get(eventType)!;
        handlers.delete(handler);
      }
    }
  };
};

/**
 * Publish a time event with debounce protection
 */
const publish = (eventType: TimeEventType, data: any = {}): boolean => {
  // Create a unique key for this event type + any ID in the data
  const eventKey = `${eventType}-${data.id || data.userId || data.date || ''}`;
  const now = Date.now();
  
  // Check if this event was recently published
  const lastPublished = recentEvents.get(eventKey);
  if (lastPublished && now - lastPublished < DEBOUNCE_THRESHOLD) {
    // Skip this event if it was published too recently
    console.debug(`[TimeEvents] Skipped duplicate event ${eventType} (debounced)`);
    return false;
  }
  
  // Update the timestamp for this event
  recentEvents.set(eventKey, now);
  
  // Clean up old entries to prevent memory leaks
  if (recentEvents.size > 100) {
    const oldestEntries = Array.from(recentEvents.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 50);
    
    oldestEntries.forEach(([key]) => recentEvents.delete(key));
  }
  
  // Get handlers for this event type
  const handlers = eventListeners.get(eventType);
  
  // If no handlers, just dispatch a DOM event
  if (!handlers || handlers.size === 0) {
    // Dispatch as DOM event for legacy support
    const event = new CustomEvent(eventType, { detail: data });
    window.dispatchEvent(event);
    return true;
  }
  
  // Call all registered handlers
  try {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TimeEvents] Error in handler for ${eventType}:`, error);
      }
    });
    
    // Also dispatch as DOM event for legacy support
    const event = new CustomEvent(eventType, { detail: data });
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error(`[TimeEvents] Error publishing ${eventType}:`, error);
    return false;
  }
};

/**
 * Clear all event listeners for cleanup
 */
const clearAllListeners = (): void => {
  eventListeners.clear();
  recentEvents.clear();
};

export const timeEventsService = {
  subscribe,
  publish,
  clearAllListeners
};
