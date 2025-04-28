
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
          const toilDeleted = await deleteTOILRecordByEntryId(entryId);
          if (toilDeleted) {
            logger.debug(`Successfully cleaned up TOIL records for entry ${entryId}`);
            
            // Dispatch TOIL update event to refresh UI immediately
            timeEventsService.publish('toil-updated', { 
              userId: deletedEntry.userId,
              date: deletedEntry.date.toISOString(),
              entryId
            });
          } else {
            logger.warn(`No TOIL records found for entry ${entryId} or cleanup failed`);
            // Continue with the flow even if TOIL cleanup doesn't find records
          }
        } catch (toilError) {
          logger.error(`Error cleaning up TOIL records for entry ${entryId}:`, toilError);
          // We'll continue with the flow even if TOIL cleanup fails
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
