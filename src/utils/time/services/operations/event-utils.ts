
import { EventManager } from "../event-handling";
import { TimeEntryEventType } from "../types";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('event-utils');

/**
 * Dispatch a time entry event
 */
export function dispatchEntryEvent(
  eventManager: EventManager, 
  type: TimeEntryEventType, 
  payload: Record<string, any>,
  userId?: string
): void {
  try {
    eventManager.dispatchEvent({
      type,
      timestamp: new Date(),
      payload,
      userId
    });
  } catch (error) {
    logger.error(`Error dispatching ${type} event:`, error);
  }
}

/**
 * Dispatch an error event
 */
export function dispatchErrorEvent(
  eventManager: EventManager,
  error: unknown,
  source: string,
  context?: Record<string, any>
): void {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    eventManager.dispatchEvent({
      type: 'error',
      timestamp: new Date(),
      payload: {
        error: errorMessage,
        source,
        ...(context || {})
      }
    });
  } catch (error) {
    logger.error(`Error dispatching error event:`, error);
  }
}
