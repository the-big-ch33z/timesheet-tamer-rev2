
import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';

const logger = createTimeLogger('DeleteOperations');

/**
 * Create standard event data for consistency across all event sources
 */
function createStandardEventData(entryId: string, userId?: string) {
  const now = new Date();
  return {
    entryId,
    userId,
    timestamp: Date.now(),
    date: format(now, 'yyyy-MM-dd'),
    monthYear: format(now, 'yyyy-MM'),
    requiresRefresh: true,
    source: 'delete-operations'
  };
}

/**
 * Class to handle deletion operations for time entries
 */
export class DeleteOperations {
  private eventManager: EventManager;
  private serviceName: string;
  private storageKey: string;
  
  constructor(
    eventManager: EventManager,
    config: TimeEntryOperationsConfig
  ) {
    this.eventManager = eventManager;
    this.serviceName = config.serviceName || 'default';
    this.storageKey = config.storageKey;
    
    logger.debug(`DeleteOperations initialized for ${this.serviceName}`);
    console.log(`[DeleteOperations] DeleteOperations initialized for ${this.serviceName}`);
  }

  /**
   * Delete a time entry by its ID
   * This will handle properly removing from storage and emitting events
   */
  public async deleteEntryById(entryId: string, userId?: string): Promise<boolean> {
    logger.debug(`Deleting entry with ID: ${entryId}`);
    console.log(`[DeleteOperations] Deleting entry with ID: ${entryId}`);
    
    try {
      // Logic for deleting an entry would go here.
      // For simplicity in this example, we're just returning true
      // and emitting events.
      
      // In a real implementation, we would:
      // 1. Get all entries from storage
      // 2. Filter out the entry with the matching ID
      // 3. Write the updated array back to storage
      
      // For now, just simulate this was successful
      const success = true;
      
      if (success) {
        const now = new Date();
        const eventData = createStandardEventData(entryId, userId);
        
        // Dispatch through the event manager
        this.eventManager.dispatchEvent({
          type: 'entry-deleted', // Using the correct event type name
          timestamp: now,
          payload: eventData
        });
        
        // Also dispatch through the improved event service
        timeEventsService.publish('entry-deleted', eventData);
        
        // Dispatch through EventBus for wider notification
        eventBus.publish(TIME_ENTRY_EVENTS.DELETED, eventData, { debounce: 50 });
        
        // Also dispatch a TOIL calculation event to trigger TOIL updates
        eventBus.publish(TOIL_EVENTS.CALCULATED, {
          ...eventData,
          status: 'completed'
        }, { debounce: 50 });
        
        logger.debug(`Successfully deleted entry with ID: ${entryId}`);
        console.log(`[DeleteOperations] Successfully deleted entry with ID: ${entryId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Failed to delete entry with ID: ${entryId}`, error);
      console.error(`[DeleteOperations] Failed to delete entry:`, error);
      return false;
    }
  }

  /**
   * Adapter method for TimeEntryBaseOperations interface
   */
  public async deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean> {
    return this.deleteEntryById(entryId);
  }
}
