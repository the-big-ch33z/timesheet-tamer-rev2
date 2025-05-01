
import { TimeEntry } from "@/types";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";
import { dispatchEntryEvent, dispatchErrorEvent } from "./event-utils";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { deleteTOILRecordByEntryId } from "../../services/toil/storage";
import { timeEventsService } from "../../events/timeEventsService";

const logger = createTimeLogger('DeleteOperations');

export class DeleteOperations {
  constructor(
    private config: Required<TimeEntryOperationsConfig>,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {}

  public async deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean> {
    if (!entryId) {
      logger.error('No entry ID provided for deletion');
      return false;
    }
    
    try {
      const allEntries = this.getAllEntries();
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      const deletedEntry = allEntries[entryIndex];
      
      // Check if this is a TOIL entry
      const isToilEntry = deletedEntry.jobNumber === "TOIL";
      
      // Delete the entry from the collection
      allEntries.splice(entryIndex, 1);
      
      // First save the entries to ensure consistency
      try {
        const saved = await saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds);
        
        if (!saved) {
          logger.error(`Failed to save after deleting entry ${entryId}`);
          return false;
        }
        
        this.invalidateCache();
        
        // Only after successful save, clean up TOIL records
        try {
          logger.debug(`Attempting to clean up TOIL records for entry ${entryId}`);
          
          // Make sure we have a valid date before calling toISOString()
          const entryDate = deletedEntry.date instanceof Date 
            ? deletedEntry.date 
            : new Date(deletedEntry.date);
            
          const toilDeleted = await deleteTOILRecordByEntryId(entryId);
          
          if (toilDeleted) {
            logger.debug(`Successfully cleaned up TOIL records for entry ${entryId}`);
            
            // Dispatch additional TOIL event for UI refresh if this was a TOIL entry
            if (isToilEntry) {
              logger.debug(`Dispatching special TOIL update for TOIL entry deletion`);
              timeEventsService.publish('toil-updated', { 
                userId: deletedEntry.userId,
                date: entryDate.toISOString(),
                entryId,
                reset: true
              });
            } else {
              // Regular TOIL update event
              timeEventsService.publish('toil-updated', { 
                userId: deletedEntry.userId,
                date: entryDate.toISOString(),
                entryId
              });
            }
          } else {
            logger.debug(`No TOIL records found for entry ${entryId} or cleanup had no effect`);
          }
        } catch (toilError) {
          logger.error(`Error cleaning up TOIL records for entry ${entryId}:`, toilError);
          // Continue even if TOIL cleanup fails
        }
        
        // Dispatch events after both operations
        dispatchEntryEvent(this.eventManager, 'entry-deleted', { entryId, entry: deletedEntry }, deletedEntry.userId);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
            detail: { entryId }
          }));
        }
        
        logger.debug(`Deleted entry ${entryId} with TOIL cleanup`);
        return true;
      } catch (saveError) {
        logger.error(`Error saving after deleting entry ${entryId}:`, saveError);
        dispatchErrorEvent(this.eventManager, saveError, 'deleteEntry', { entryId });
        return false;
      }
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}`, error);
      dispatchErrorEvent(this.eventManager, error, 'deleteEntry', { entryId });
      return false;
    }
  }
}
