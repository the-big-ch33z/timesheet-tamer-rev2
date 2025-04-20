
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { validateTimeEntry } from "../entry-validation";
import { ensureDate } from "../../validation/dateValidation";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";
import { dispatchEntryEvent, dispatchErrorEvent } from "./event-utils";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";

const logger = createTimeLogger('CreateOperations');

export class CreateOperations {
  constructor(
    private config: Required<TimeEntryOperationsConfig>,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {}

  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    const validation = validateTimeEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      dispatchErrorEvent(this.eventManager, validation.message, 'createEntry', entryData);
      return null;
    }
    
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      const error = 'Invalid date in entry data';
      logger.error(error, entryData);
      dispatchErrorEvent(this.eventManager, error, 'createEntry', entryData);
      return null;
    }
    
    try {
      const newId = uuidv4();
      const newEntry: TimeEntry = {
        ...entryData,
        id: newId,
        date: entryDate
      };
      
      const allEntries = this.getAllEntries();
      allEntries.push(newEntry);
      
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            dispatchEntryEvent(this.eventManager, 'entry-created', { entry: newEntry }, newEntry.userId);
            logger.debug(`Created new entry with ID ${newId}`, newEntry);
          } else {
            logger.error('Failed to save new entry');
            dispatchErrorEvent(this.eventManager, 'Failed to save new entry', 'createEntry', entryData);
          }
        })
        .catch(error => {
          logger.error('Error saving new entry:', error);
          dispatchErrorEvent(this.eventManager, error, 'createEntry', entryData);
        });
      
      return newId;
    } catch (error) {
      logger.error('Error creating entry', error);
      dispatchErrorEvent(this.eventManager, error, 'createEntry', entryData);
      return null;
    }
  }
}
