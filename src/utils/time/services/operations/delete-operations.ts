
import { TimeEntry } from "@/types";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";
import { dispatchEntryEvent, dispatchErrorEvent } from "./event-utils";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";

const logger = createTimeLogger('DeleteOperations');

export class DeleteOperations {
  constructor(
    private config: Required<TimeEntryOperationsConfig>,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {}

  public deleteEntry(entryId: string, deletedEntryIds: string[]): boolean {
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
      
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            dispatchEntryEvent(this.eventManager, 'entry-deleted', { entryId, entry: deletedEntry }, deletedEntry.userId);
            
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
                detail: { entryId }
              }));
            }
            
            logger.debug(`Deleted entry ${entryId}`);
          } else {
            logger.error(`Failed to save after deleting entry ${entryId}`);
          }
        })
        .catch(error => {
          logger.error(`Error saving after deleting entry ${entryId}:`, error);
          dispatchErrorEvent(this.eventManager, error, 'deleteEntry', { entryId });
        });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}`, error);
      dispatchErrorEvent(this.eventManager, error, 'deleteEntry', { entryId });
      return false;
    }
  }
}
