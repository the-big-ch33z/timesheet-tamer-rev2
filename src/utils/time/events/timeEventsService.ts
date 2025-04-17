
/**
 * Simple event service for timesheet-related events
 */

type TimeEventType = 'entry-created' | 'entry-updated' | 'entry-deleted' | 'hours-updated' | 'hours-reset';

interface TimeEventPayload {
  [key: string]: any;
}

interface TimeEvent {
  type: TimeEventType;
  payload: TimeEventPayload;
}

type TimeEventListener = (event: TimeEvent) => void;

class TimeEventsService {
  private listeners: Map<TimeEventType, Set<TimeEventListener>> = new Map();

  /**
   * Subscribe to a specific event type
   * @param type Event type to listen for
   * @param callback Function to call when event occurs
   * @returns Unsubscribe function
   */
  subscribe(type: TimeEventType, callback: TimeEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const callbacks = this.listeners.get(type)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * @param type Event type
   * @param payload Event data
   */
  publish(type: TimeEventType, payload: TimeEventPayload = {}): void {
    console.debug(`[TimeEventsService] Publishing event: ${type}`, payload);
    
    const callbacks = this.listeners.get(type);
    if (!callbacks) return;

    const event: TimeEvent = { type, payload };
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[TimeEventsService] Error in event listener for ${type}:`, error);
      }
    });
    
    // Also publish to window event system for cross-component communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`timesheet:${type}`, { 
        detail: payload 
      }));
    }
  }
}

// Create singleton instance
export const timeEventsService = new TimeEventsService();

// Add window event listener for global save events
if (typeof window !== 'undefined') {
  window.addEventListener('timesheet:save-pending-changes', () => {
    console.debug('[TimeEventsService] Global save event detected');
    timeEventsService.publish('hours-updated', { source: 'global-save' });
  });
}
