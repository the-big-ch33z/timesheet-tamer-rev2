import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';
import { loadEntriesFromStorage, saveEntriesToStorage, addToDeletedEntries } from "../storage-operations";
import { deleteAllToilData, triggerUIStateUpdate } from "../toil/unifiedDeletion";

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
   * ENHANCED: Delete a time entry by its ID with improved TOIL regeneration
   */
  public async deleteEntryById(entryId: string, userId?: string, options?: {
    workSchedule?: any;
    allEntries?: any[];
  }): Promise<boolean> {
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
      
      // Get remaining entries after deletion for regeneration
      const updatedEntries = currentEntries.filter(entry => entry.id !== entryId);
      const userEntriesAfterDeletion = updatedEntries.filter(entry => entry.userId === userId);
      
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
      
      // ENHANCED UNIFIED TOIL CLEANUP WITH AUTO-REGENERATION
      try {
        console.log(`[TOIL-DEBUG] ==> STARTING ENHANCED TOIL CLEANUP for entry ${entryId}`);
        logger.debug(`Starting enhanced TOIL cleanup for entry ${entryId}`);
        
        if (userId) {
          // Prepare regeneration options
          const regenerationOptions = {
            workSchedule: options?.workSchedule,
            currentEntries: userEntriesAfterDeletion,
            currentDate: new Date(entryToDelete.date),
            skipRegeneration: userEntriesAfterDeletion.length === 0 // Skip if no entries remain
          };
          
          console.log(`[TOIL-DEBUG] Deletion options:`, {
            hasWorkSchedule: !!regenerationOptions.workSchedule,
            remainingEntries: userEntriesAfterDeletion.length,
            willRegenerate: !regenerationOptions.skipRegeneration
          });
          
          const deletionResult = await deleteAllToilData(userId, regenerationOptions);
          
          if (deletionResult.success) {
            console.log(`[TOIL-DEBUG] ✅ Enhanced TOIL cleanup completed for entry ${entryId}`, {
              summary: deletionResult.summary,
              regenerated: deletionResult.regenerationTriggered
            });
            logger.debug(`Enhanced TOIL cleanup completed for entry ${entryId}`, deletionResult);
            
            // Trigger UI state update with regeneration status
            triggerUIStateUpdate(deletionResult.regenerationTriggered);
            console.log(`[TOIL-DEBUG] ✅ UI state update triggered with regeneration: ${deletionResult.regenerationTriggered}`);
          } else {
            console.error(`[TOIL-DEBUG] ❌ Enhanced TOIL cleanup failed for entry ${entryId}:`, deletionResult.errors);
            logger.error(`Enhanced TOIL cleanup failed for entry ${entryId}:`, deletionResult.errors);
          }
        }
      } catch (toilError) {
        console.error(`[TOIL-DEBUG] ❌ Enhanced TOIL cleanup error for entry ${entryId}:`, toilError);
        logger.error(`Error during enhanced TOIL cleanup for entry ${entryId}:`, toilError);
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
