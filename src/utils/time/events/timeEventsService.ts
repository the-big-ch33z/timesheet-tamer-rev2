
import { createTimeLogger } from '../errors';

const logger = createTimeLogger('TimeEventsService');

// Event types that can be dispatched throughout the application
export type TimeEventType = 
  | 'entry-created' 
  | 'entry-updated'
  | 'entry-deleted'
  | 'work-hours-changed'
  | 'date-changed'
  | 'user-changed'
  | 'timesheet-refresh-needed';

// Event data interface
export interface TimeEvent {
  type: TimeEventType;
  payload?: any;
  timestamp: number;
}

// Event handler type
export type TimeEventHandler = (event: TimeEvent) => void;

// Global event system for timesheet events
class TimeEventsService {
  private handlers: Map<TimeEventType, Set<TimeEventHandler>> = new Map();
  private globalHandlers: Set<TimeEventHandler> = new Set();
  
  /**
   * Subscribe to a specific event type
   */
  public subscribe(type: TimeEventType, handler: TimeEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    logger.debug(`Subscribed handler to ${type} events`);
    
    // Return unsubscribe function
    return () => {
      const typeHandlers = this.handlers.get(type);
      if (typeHandlers) {
        typeHandlers.delete(handler);
        logger.debug(`Unsubscribed handler from ${type} events`);
      }
    };
  }
  
  /**
   * Subscribe to all events
   */
  public subscribeToAll(handler: TimeEventHandler): () => void {
    this.globalHandlers.add(handler);
    logger.debug('Subscribed handler to all events');
    
    // Return unsubscribe function
    return () => {
      this.globalHandlers.delete(handler);
      logger.debug('Unsubscribed handler from all events');
    };
  }
  
  /**
   * Dispatch an event
   */
  public dispatch(type: TimeEventType, payload?: any): void {
    const event: TimeEvent = {
      type,
      payload,
      timestamp: Date.now()
    };
    
    // Log the event
    logger.debug(`Dispatching event: ${type}`, payload);
    
    // Call type-specific handlers
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error(`Error in ${type} event handler`, error);
        }
      });
    }
    
    // Call global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        logger.error(`Error in global event handler for ${type} event`, error);
      }
    });
  }
  
  /**
   * Clear all handlers (typically used in tests)
   */
  public clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    logger.debug('Cleared all event handlers');
  }
}

// Singleton instance
export const timeEventsService = new TimeEventsService();

// Helper to create hooks that respond to timesheet events
export const createTimesheetEventHandler = (
  eventTypes: TimeEventType[], 
  handler: TimeEventHandler
): () => void => {
  // Create unsubscribe functions for each event type
  const unsubscribers = eventTypes.map(type => 
    timeEventsService.subscribe(type, handler)
  );
  
  // Return a function that unsubscribes from all events
  return () => unsubscribers.forEach(unsubscribe => unsubscribe());
};
