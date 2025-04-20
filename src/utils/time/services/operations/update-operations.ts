
import { TimeEntry } from "@/types";
import { ensureDate } from "../../validation/dateValidation";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";
import { dispatchEntryEvent, dispatchErrorEvent } from "./event-utils";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";

const logger = createTimeLogger('UpdateOperations');

export class UpdateOperations {
  constructor(
    private config: Required<TimeEntryOperationsConfig>,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {}

  public updateEntry(entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for update');
      return false;
    }
    
    try {
      if (updates.date) {
        const validDate = ensureDate(updates.date);
        if (!validDate) {
          logger.error('Invalid date in update data', updates);
          return false;
        }
        updates.date = validDate;
      }
      
      const allEntries = this.getAllEntries();
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.error(`Entry with ID ${entryId} not found for update`);
        return false;
      }
      
      const originalEntry = allEntries[entryIndex];
      const updatedEntry = {
        ...originalEntry,
        ...updates
      };
      
      allEntries[entryIndex] = updatedEntry;
      
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            dispatchEntryEvent(this.eventManager, 'entry-updated', {
              entryId,
              updates,
              original: originalEntry,
              updated: updatedEntry
            }, updatedEntry.userId);
            logger.debug(`Updated entry ${entryId}`, updates);
          } else {
            logger.error(`Failed to save update for entry ${entryId}`);
          }
        })
        .catch(error => {
          logger.error(`Error updating entry ${entryId}:`, error);
          dispatchErrorEvent(this.eventManager, error, 'updateEntry', { entryId, updates });
        });
      
      return true;
    } catch (error) {
      logger.error(`Error updating entry ${entryId}`, error);
      dispatchErrorEvent(this.eventManager, error, 'updateEntry', { entryId, updates });
      return false;
    }
  }
}
