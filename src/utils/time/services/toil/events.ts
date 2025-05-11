
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('toil-events');

export type TOILEventType = 
  | 'toil-accrued'
  | 'toil-used'
  | 'toil-updated'
  | 'toil-error';

export interface TOILEvent {
  type: TOILEventType;
  userId: string;
  timestamp: Date;
  payload: Record<string, any>;
}

// Event listeners storage
const listeners: Map<TOILEventType, Array<(event: TOILEvent) => void>> = new Map();

/**
 * Dispatch a TOIL event
 */
export const dispatchTOILEvent = (event: TOILEvent): void => {
  logger.debug(`Dispatching TOIL event: ${event.type}`, event.payload);
  
  const eventListeners = listeners.get(event.type) || [];
  eventListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      logger.error(`Error in TOIL event listener for ${event.type}:`, error);
    }
  });
};

/**
 * Add a TOIL event listener
 */
export const addTOILEventListener = (
  type: TOILEventType,
  listener: (event: TOILEvent) => void
): () => void => {
  if (!listeners.has(type)) {
    listeners.set(type, []);
  }
  
  const eventListeners = listeners.get(type)!;
  eventListeners.push(listener);
  
  // Return a function to remove this listener
  return () => {
    removeTOILEventListener(type, listener);
  };
};

/**
 * Remove a TOIL event listener
 */
export const removeTOILEventListener = (
  type: TOILEventType,
  listener: (event: TOILEvent) => void
): boolean => {
  if (!listeners.has(type)) return false;
  
  const eventListeners = listeners.get(type)!;
  const index = eventListeners.indexOf(listener);
  
  if (index === -1) return false;
  
  eventListeners.splice(index, 1);
  return true;
};
