
import { TimeEntry } from "@/types";
import { EventManager } from "../event-handling";

export const dispatchEntryEvent = (
  eventManager: EventManager,
  type: 'entry-created' | 'entry-updated' | 'entry-deleted' | 'error',
  payload: any,
  userId?: string
) => {
  eventManager.dispatchEvent({
    type,
    timestamp: new Date(),
    payload,
    userId
  });
};

export const dispatchErrorEvent = (
  eventManager: EventManager, 
  error: any, 
  context: string, 
  data?: any
) => {
  eventManager.dispatchEvent({
    type: 'error',
    timestamp: new Date(),
    payload: { error, context, data }
  });
};
