
/**
 * Enhanced event manager for time entry operations
 * 
 * @deprecated Use TimeEventsService from @/utils/time/events/timeEventsService instead
 */

import { TimeEntryEvent, TimeEntryEventListener, TimeEntryEventType } from './unified-service';
import { createTimeLogger } from '../errors';

const logger = createTimeLogger('EventManager');

export class EventManager {
  private eventListeners: Map<TimeEntryEventType, Set<TimeEntryEventListener>> = new Map();

  public addEventListener(
    type: TimeEntryEventType, 
    listener: TimeEntryEventListener
  ): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    const listeners = this.eventListeners.get(type)!;
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    };
  }

  public dispatchEvent(event: TimeEntryEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in event listener', error);
        }
      });
    }

    const allListeners = this.eventListeners.get('all');
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in event listener', error);
        }
      });
    }
    
    // Integrate with timeEventsService for backward compatibility
    try {
      const timeEventsService = require('../events/timeEventsService').timeEventsService;
      if (timeEventsService && timeEventsService.publish) {
        timeEventsService.publish(`time-${event.type}`, {
          ...event.payload,
          timestamp: event.timestamp,
          userId: event.userId
        });
      }
    } catch (error) {
      // Silently fail if the service is not available
    }
  }

  public setupStorageListener(
    storageKey: string, 
    onStorageChange: () => void,
    onDeletedEntriesChange: () => void,
    deletedEntriesKey: string
  ): () => void {
    const handleStorageEvent = (event: StorageEvent): void => {
      if (event.key === storageKey) {
        onStorageChange();
        this.dispatchEvent({
          type: 'storage-sync',
          timestamp: new Date(),
          payload: { source: 'storage-event' }
        });
      } else if (event.key === deletedEntriesKey) {
        onDeletedEntriesChange();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
      return () => {
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
    
    return () => {};
  }

  public clear(): void {
    this.eventListeners.clear();
  }
}
