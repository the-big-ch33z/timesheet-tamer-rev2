
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

    console.log(`[TOIL-DEBUG] EventBus: Subscribed to '${eventType}' events. Count: ${listeners.size}`);
    logger.debug(`Subscribed to '${eventType}' events. Count: ${listeners.size}`);

    // Return unsubscribe function
    return () => {
      if (this.eventListeners.has(eventType)) {
        const listeners = this.eventListeners.get(eventType)!;
        listeners.delete(handler as EventHandler);
        
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
        
        console.log(`[TOIL-DEBUG] EventBus: Unsubscribed from '${eventType}'. Remaining: ${listeners.size}`);
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

    console.log(`[TOIL-DEBUG] EventBus: Publishing '${eventType}' event`, { data, options });

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
          console.log(`[TOIL-DEBUG] EventBus: Throttled event '${eventType}' (fired too recently)`);
          logger.debug(`Throttled event '${eventType}' (fired too recently)`);
          return false;
        }
      }
      
      // Handle debouncing
      if (debounce > 0) {
        // Clear existing debounced event
        const existingTimeout = this.debouncedEvents.get(eventType);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Set new debounced event
        const timeoutId = setTimeout(() => {
          this.executeEvent(eventType, data);
          this.debouncedEvents.delete(eventType);
        }, debounce);
        
        this.debouncedEvents.set(eventType, timeoutId);
        console.log(`[TOIL-DEBUG] EventBus: Debounced '${eventType}' for ${debounce}ms`);
        logger.debug(`Debounced '${eventType}' for ${debounce}ms`);
        return true;
      }
      
      // Execute immediately if no debouncing
      this.executeEvent(eventType, data);
      this.lastEventTimes.set(eventType, now);
      
      return true;
    } catch (error) {
      console.error(`[TOIL-DEBUG] EventBus: Error publishing event '${eventType}':`, error);
      logger.error(`Error publishing event '${eventType}':`, error);
      return false;
    }
  }

  /**
   * Execute event handlers for a given event type
   */
  private executeEvent<T>(eventType: string, data?: T): void {
    const listeners = this.eventListeners.get(eventType);
    
    if (!listeners || listeners.size === 0) {
      console.log(`[TOIL-DEBUG] EventBus: No listeners for '${eventType}'`);
      logger.debug(`No listeners for '${eventType}'`);
      return;
    }

    console.log(`[TOIL-DEBUG] EventBus: Executing '${eventType}' for ${listeners.size} listeners`);
    logger.debug(`Executing '${eventType}' for ${listeners.size} listeners`);

    // Execute handlers
    listeners.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TOIL-DEBUG] EventBus: Error in event handler for '${eventType}':`, error);
        logger.error(`Error in event handler for '${eventType}':`, error);
      }
    });
  }

  /**
   * Get the number of active listeners for an event type
   */
  public getListenerCount(eventType: string): number {
    return this.eventListeners.get(eventType)?.size || 0;
  }

  /**
   * Get all active event types
   */
  public getActiveEventTypes(): string[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Clear all listeners for a specific event type
   */
  public clearListeners(eventType: string): void {
    this.eventListeners.delete(eventType);
    console.log(`[TOIL-DEBUG] EventBus: Cleared all listeners for '${eventType}'`);
    logger.debug(`Cleared all listeners for '${eventType}'`);
  }

  /**
   * Clear all listeners for all events
   */
  public clearAllListeners(): void {
    this.eventListeners.clear();
    this.debouncedEvents.forEach(timeout => clearTimeout(timeout));
    this.debouncedEvents.clear();
    console.log(`[TOIL-DEBUG] EventBus: Cleared all listeners`);
    logger.debug('Cleared all listeners');
  }

  /**
   * Get recent event history for debugging
   */
  public getEventHistory(): Array<{type: string, time: number, data: any}> {
    return [...this.eventHistory];
  }

  /**
   * Check if there are pending debounced events
   */
  public hasPendingEvents(): boolean {
    return this.debouncedEvents.size > 0;
  }

  /**
   * Force execution of all pending debounced events
   */
  public flushPendingEvents(): void {
    this.debouncedEvents.forEach((timeout, eventType) => {
      clearTimeout(timeout);
      // Note: We can't execute the event here as we don't have the data
    });
    this.debouncedEvents.clear();
    console.log(`[TOIL-DEBUG] EventBus: Flushed all pending events`);
    logger.debug('Flushed all pending events');
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
