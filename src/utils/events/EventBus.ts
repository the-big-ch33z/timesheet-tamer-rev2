import { createTimeLogger } from '../time/errors';

const logger = createTimeLogger('EventBus');

export type EventHandler<T = any> = (data: T) => void;
export type EventUnsubscribe = () => void;
export type EventOptions = {
  debounce?: number;
  deduplicate?: boolean;
  throttle?: number;
};

/**
 * Centralized event bus system for application-wide events
 * This replaces multiple fragmented event implementations with a unified API
 */
export class EventBus {
  private static instance: EventBus;
  private eventListeners = new Map<string, Set<EventHandler>>();
  private debouncedEvents = new Map<string, NodeJS.Timeout>();
  private lastEventTimes = new Map<string, number>();
  private eventHistory: Array<{type: string, time: number, data: any}> = [];
  private readonly MAX_HISTORY = 50;

  private constructor() {
    // Singleton pattern - private constructor
  }

  /**
   * Get the singleton instance of EventBus
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
      logger.debug('EventBus instance created');
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * 
   * @param eventType - The event type to subscribe to
   * @param handler - The callback function to execute when event is emitted
   * @returns A function to unsubscribe
   */
  public subscribe<T>(eventType: string, handler: EventHandler<T>): EventUnsubscribe {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    const listeners = this.eventListeners.get(eventType)!;
    listeners.add(handler as EventHandler);

    logger.debug(`Subscribed to '${eventType}' events. Count: ${listeners.size}`);

    // Return unsubscribe function
    return () => {
      if (this.eventListeners.has(eventType)) {
        const listeners = this.eventListeners.get(eventType)!;
        listeners.delete(handler as EventHandler);
        
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
        
        logger.debug(`Unsubscribed from '${eventType}'. Remaining: ${listeners.size}`);
      }
    };
  }

  /**
   * Publish an event with optional debouncing and throttling
   * 
   * @param eventType - The event type to publish
   * @param data - The data to pass to subscribers
   * @param options - Optional configuration for event publishing
   * @returns True if the event was published or scheduled
   */
  public publish<T>(eventType: string, data?: T, options: EventOptions = {}): boolean {
    const { debounce = 0, deduplicate = false, throttle = 0 } = options;
    const now = Date.now();

    // Record event in history
    this.eventHistory.unshift({ type: eventType, time: now, data });
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    try {
      // Apply throttling if configured (skip event if too recent)
      if (throttle > 0) {
        const lastTime = this.lastEventTimes.get(eventType) || 0;
        if (now - lastTime < throttle) {
          logger.debug(`Throttled event '${eventType}' (fired too recently)`);
          return false;
        }
      }
      
      // Handle debouncing if configured
      if (debounce > 0) {
        const debouncedKey = `${eventType}${deduplicate ? JSON.stringify(data) : ''}`;
        
        if (this.debouncedEvents.has(debouncedKey)) {
          clearTimeout(this.debouncedEvents.get(debouncedKey)!);
          logger.debug(`Debounced event '${eventType}' reset`);
        }

        this.debouncedEvents.set(
          debouncedKey,
          setTimeout(() => {
            this.executePublish(eventType, data);
            this.debouncedEvents.delete(debouncedKey);
            this.lastEventTimes.set(eventType, Date.now());
          }, debounce)
        );
        
        return true;
      }

      // Otherwise publish immediately
      this.lastEventTimes.set(eventType, now);
      return this.executePublish(eventType, data);
    } catch (error) {
      logger.error(`Error publishing ${eventType}:`, error);
      return false;
    }
  }

  /**
   * Actually execute publishing the event to all subscribers
   */
  private executePublish<T>(eventType: string, data?: T): boolean {
    const listeners = this.eventListeners.get(eventType);
    const count = listeners?.size || 0;

    logger.debug(`Publishing '${eventType}' to ${count} listeners`);

    if (!count) {
      // Emit DOM event for legacy listeners if no direct subscribers
      if (typeof window !== 'undefined') {
        try {
          const event = new CustomEvent(eventType, { detail: data });
          window.dispatchEvent(event);
        } catch (error) {
          logger.error(`Error dispatching DOM event for ${eventType}:`, error);
        }
      }
      return true;
    }

    // Call all listeners
    listeners!.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    });

    // Do NOT broadcast DOM events if we already have direct subscribers
    // This helps prevent circular event loops
    return true;
  }

  /**
   * Get a copy of the recent event history (for debugging)
   */
  public getEventHistory() {
    return [...this.eventHistory];
  }

  /**
   * Clear all event listeners (mainly for testing)
   */
  public clearAllListeners(): void {
    this.eventListeners.clear();
    this.debouncedEvents.forEach((timeout) => clearTimeout(timeout));
    this.debouncedEvents.clear();
    this.lastEventTimes.clear();
    logger.debug('All event listeners cleared');
  }

  /**
   * Get count of subscribers for a particular event type (for testing)
   */
  public getSubscriberCount(eventType: string): number {
    return this.eventListeners.get(eventType)?.size || 0;
  }
}

// Export a singleton instance
export const eventBus = EventBus.getInstance();
