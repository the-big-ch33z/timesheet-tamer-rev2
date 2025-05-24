
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('EventManager');

export type TimeEntryEventType = 
  | 'entry-created' 
  | 'entry-updated'
  | 'entry-deleted'
  | 'entries-loaded'
  | 'storage-sync'
  | 'error'
  | 'all';

export interface TimeEntryEvent {
  type: TimeEntryEventType;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

export type TimeEntryEventListener = (event: TimeEntryEvent) => void;

/**
 * Enhanced event manager for time entry operations
 */
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
