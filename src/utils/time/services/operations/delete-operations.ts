
import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';
import { loadEntriesFromStorage, saveEntriesToStorage, addToDeletedEntries } from "../storage-operations";

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
      // Load current entries from storage
      const currentEntries = loadEntriesFromStorage(this.storageKey, []);
      
      // Find the entry to get its user ID if not provided
      const entryToDelete = currentEntries.find(entry => entry.id === entryId);
      if (entryToDelete && !userId) {
        userId = entryToDelete.userId;
      }
      
      // Check if entry exists
      if (!entryToDelete) {
        logger.warn(`Entry with ID ${entryId} not found in storage`);
        return false;
      }
      
      // Filter out the entry to delete
      const updatedEntries = currentEntries.filter(entry => entry.id !== entryId);
      
      // Save updated entries back to storage
      const saveSuccess = await saveEntriesToStorage(updatedEntries, this.storageKey, []);
      
      if (!saveSuccess) {
        logger.error(`Failed to save entries after deleting ${entryId}`);
        return false;
      }
      
      // Mark the entry as deleted in the deletion tracking system
      try {
        await addToDeletedEntries(entryId, [], 'time-entries-deleted');
        logger.debug(`Added entry ${entryId} to deletion tracking`);
      } catch (error) {
        logger.warn(`Failed to add entry to deletion tracking: ${error}`);
        // Continue execution as the main deletion succeeded
      }
      
      // Dispatch events for TOIL cleanup and UI updates
      const now = new Date();
      const eventData = createStandardEventData(entryId, userId);
      
      // Dispatch through the event manager
      this.eventManager.dispatchEvent({
        type: 'entry-deleted',
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
      
      return true;
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
