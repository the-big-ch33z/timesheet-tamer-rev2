
import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';
import { loadEntriesFromStorage, saveEntriesToStorage, addToDeletedEntries } from "../storage-operations";
import { deleteTOILRecordsByEntryId, deleteTOILUsageByEntryId } from "@/utils/time/services/toil/storage";

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
    console.log(`[TOIL-DEBUG] DeleteOperations initialized for ${this.serviceName}`);
  }

  /**
   * Delete a time entry by its ID
   * This will handle properly removing from storage, cleaning up TOIL records, and emitting events
   */
  public async deleteEntryById(entryId: string, userId?: string): Promise<boolean> {
    console.log(`[TOIL-DEBUG] ==> DELETE ENTRY FLOW START: ${entryId}`);
    logger.debug(`Deleting entry with ID: ${entryId}`);
    
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
        console.log(`[TOIL-DEBUG] ❌ Entry ${entryId} not found in storage`);
        logger.warn(`Entry with ID ${entryId} not found in storage`);
        return false;
      }
      
      console.log(`[TOIL-DEBUG] ✅ Found entry to delete:`, {
        id: entryToDelete.id,
        userId: entryToDelete.userId,
        hours: entryToDelete.hours,
        date: entryToDelete.date,
        jobNumber: entryToDelete.jobNumber
      });
      
      // Filter out the entry to delete
      const updatedEntries = currentEntries.filter(entry => entry.id !== entryId);
      
      // Save updated entries back to storage
      const saveSuccess = await saveEntriesToStorage(updatedEntries, this.storageKey, []);
      
      if (!saveSuccess) {
        console.log(`[TOIL-DEBUG] ❌ Failed to save entries after deleting ${entryId}`);
        logger.error(`Failed to save entries after deleting ${entryId}`);
        return false;
      }
      
      console.log(`[TOIL-DEBUG] ✅ Entry deleted from storage successfully`);
      
      // Mark the entry as deleted in the deletion tracking system
      try {
        await addToDeletedEntries(entryId, [], 'time-entries-deleted');
        console.log(`[TOIL-DEBUG] ✅ Added entry ${entryId} to deletion tracking`);
        logger.debug(`Added entry ${entryId} to deletion tracking`);
      } catch (error) {
        console.log(`[TOIL-DEBUG] ⚠️ Failed to add entry to deletion tracking: ${error}`);
        logger.warn(`Failed to add entry to deletion tracking: ${error}`);
        // Continue execution as the main deletion succeeded
      }
      
      // DIRECT TOIL CLEANUP - Execute synchronously to ensure TOIL records are removed
      try {
        console.log(`[TOIL-DEBUG] ==> STARTING TOIL CLEANUP for entry ${entryId}`);
        logger.debug(`Starting direct TOIL cleanup for entry ${entryId}`);
        
        // Delete TOIL records associated with this entry
        const deletedRecordsCount = await deleteTOILRecordsByEntryId(entryId);
        console.log(`[TOIL-DEBUG] ✅ Deleted ${deletedRecordsCount} TOIL records for entry ${entryId}`);
        logger.debug(`Deleted ${deletedRecordsCount} TOIL records for entry ${entryId}`);
        
        // Delete TOIL usage records associated with this entry
        const deletedUsageCount = await deleteTOILUsageByEntryId(entryId);
        console.log(`[TOIL-DEBUG] ✅ Deleted ${deletedUsageCount} TOIL usage records for entry ${entryId}`);
        logger.debug(`Deleted ${deletedUsageCount} TOIL usage records for entry ${entryId}`);
        
        console.log(`[TOIL-DEBUG] ✅ TOIL cleanup completed: ${deletedRecordsCount} records, ${deletedUsageCount} usage items deleted for entry ${entryId}`);
      } catch (toilError) {
        console.error(`[TOIL-DEBUG] ❌ TOIL cleanup failed for entry ${entryId}:`, toilError);
        logger.error(`Error during direct TOIL cleanup for entry ${entryId}:`, toilError);
        // Don't fail the entire operation if TOIL cleanup fails
      }
      
      // Dispatch events with standardized format for UI updates
      const eventData = createStandardEventData(entryId, userId);
      
      console.log(`[TOIL-DEBUG] ==> DISPATCHING STANDARDIZED EVENTS for deleted entry ${entryId}`, eventData);
      logger.debug('Dispatching standardized deletion events:', eventData);
      
      // Dispatch through the event manager
      this.eventManager.dispatchEvent({
        type: 'entry-deleted',
        timestamp: new Date(),
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
      
      console.log(`[TOIL-DEBUG] ✅ All standardized events dispatched for entry deletion ${entryId}`);
      console.log(`[TOIL-DEBUG] Event format verification:`, {
        hasEntryId: !!eventData.entryId,
        hasUserId: !!eventData.userId,
        hasTimestamp: !!eventData.timestamp,
        hasRequiresRefresh: eventData.requiresRefresh === true,
        format: 'standardized'
      });
      console.log(`[TOIL-DEBUG] ==> DELETE ENTRY FLOW COMPLETE: ${entryId}`);
      
      logger.debug(`Successfully deleted entry with ID: ${entryId}`);
      
      return true;
    } catch (error) {
      console.error(`[TOIL-DEBUG] ❌ DELETE ENTRY FLOW FAILED for ${entryId}:`, error);
      logger.error(`Failed to delete entry with ID: ${entryId}`, error);
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
