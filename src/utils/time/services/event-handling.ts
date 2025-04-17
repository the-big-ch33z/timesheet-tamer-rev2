
import { TimeEntryEvent, TimeEntryEventType, TimeEntryEventListener } from './types';
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('TimeEntryEvents');

/**
 * Manages event listeners and event dispatch for time entry operations
 */
export class EventManager {
  private eventListeners: Map<TimeEntryEventType, Set<TimeEntryEventListener>> = new Map();

  /**
   * Add event listener
   */
  public addEventListener(
    type: TimeEntryEventType, 
    listener: TimeEntryEventListener
  ): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    const listeners = this.eventListeners.get(type)!;
    listeners.add(listener);
    
    // Return cleanup function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    };
  }

  /**
   * Dispatch an event to all listeners
   */
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

    // Also dispatch to 'all' listeners if any
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

  /**
   * Setup storage event listener for cross-tab synchronization
   */
  public setupStorageListener(
    storageKey: string, 
    onStorageChange: () => void,
    onDeletedEntriesChange: () => void,
    deletedEntriesKey: string
  ): () => void {
    const handleStorageEvent = (event: StorageEvent): void => {
      if (event.key === storageKey) {
        // Another tab has modified the entries
        onStorageChange();
        
        // Dispatch event for subscribers
        this.dispatchEvent({
          type: 'storage-sync',
          timestamp: new Date(),
          payload: { source: 'storage-event' }
        });
        
        logger.debug('Storage event detected, cache invalidated');
      } else if (event.key === deletedEntriesKey) {
        // Reload deleted entries
        onDeletedEntriesChange();
        logger.debug('Deleted entries updated from another tab');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
    
    // Return no-op cleanup if no window
    return () => {};
  }

  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.eventListeners.clear();
  }
  
  /**
   * Get the count of listeners for a specific event type
   */
  public getListenerCount(type: TimeEntryEventType): number {
    const listeners = this.eventListeners.get(type);
    return listeners ? listeners.size : 0;
  }
}
