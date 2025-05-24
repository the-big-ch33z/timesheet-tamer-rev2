import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';
import { loadEntriesFromStorage, saveEntriesToStorage, addToDeletedEntries } from "../storage-operations";
import { deleteAllToilData, triggerUIStateUpdate } from "../../toil/unifiedDeletion";

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
      const currentEntries = loadEntriesFromStorage(this.storageKey, []);
      
      const entryToDelete = currentEntries.find(entry => entry.id === entryId);
      if (entryToDelete && !userId) {
        userId = entryToDelete.userId;
      }
      
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
      
      const updatedEntries = currentEntries.filter(entry => entry.id !== entryId);
      
      const saveSuccess = await saveEntriesToStorage(updatedEntries, this.storageKey, []);
      
      if (!saveSuccess) {
        console.log(`[TOIL-DEBUG] ❌ Failed to save entries after deleting ${entryId}`);
        logger.error(`Failed to save entries after deleting ${entryId}`);
        return false;
      }
      
      console.log(`[TOIL-DEBUG] ✅ Entry deleted from storage successfully`);
      
      try {
        await addToDeletedEntries(entryId, [], 'time-entries-deleted');
        console.log(`[TOIL-DEBUG] ✅ Added entry ${entryId} to deletion tracking`);
        logger.debug(`Added entry ${entryId} to deletion tracking`);
      } catch (error) {
        console.log(`[TOIL-DEBUG] ⚠️ Failed to add entry to deletion tracking: ${error}`);
        logger.warn(`Failed to add entry to deletion tracking: ${error}`);
      }
      
      // UNIFIED TOIL CLEANUP - Use the master deletion function
      try {
        console.log(`[TOIL-DEBUG] ==> STARTING UNIFIED TOIL CLEANUP for entry ${entryId}`);
        logger.debug(`Starting unified TOIL cleanup for entry ${entryId}`);
        
        // Use unified deletion to clean up all TOIL data for this user
        if (userId) {
          const deletionResult = await deleteAllToilData(userId);
          
          if (deletionResult.success) {
            console.log(`[TOIL-DEBUG] ✅ Unified TOIL cleanup completed successfully for entry ${entryId}`, deletionResult.summary);
            logger.debug(`Unified TOIL cleanup completed for entry ${entryId}`, deletionResult);
            
            // Trigger UI state update
            triggerUIStateUpdate();
            console.log(`[TOIL-DEBUG] ✅ UI state update triggered after TOIL cleanup`);
          } else {
            console.error(`[TOIL-DEBUG] ❌ Unified TOIL cleanup failed for entry ${entryId}:`, deletionResult.errors);
            logger.error(`Unified TOIL cleanup failed for entry ${entryId}:`, deletionResult.errors);
          }
        }
      } catch (toilError) {
        console.error(`[TOIL-DEBUG] ❌ Unified TOIL cleanup error for entry ${entryId}:`, toilError);
        logger.error(`Error during unified TOIL cleanup for entry ${entryId}:`, toilError);
      }
      
      // Dispatch events for UI updates (keeping these for other systems that might depend on them)
      const now = new Date();
      const eventData = createStandardEventData(entryId, userId);
      
      console.log(`[TOIL-DEBUG] ==> DISPATCHING EVENTS for deleted entry ${entryId}`, eventData);
      
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
      
      console.log(`[TOIL-DEBUG] ✅ All events dispatched for entry deletion ${entryId}`);
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
