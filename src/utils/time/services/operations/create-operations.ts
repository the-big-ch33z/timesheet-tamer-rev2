
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { validateTimeEntry } from "../entry-validation";
import { TimeEntryEvent } from "../types";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('CreateOperations');

/**
 * Create a new time entry
 */
export const createTimeEntry = async (
  entryData: Omit<TimeEntry, "id">,
  allEntries: TimeEntry[],
  deletedEntryIds: string[],
  storageKey: string,
  dispatchEvent: (event: TimeEntryEvent) => void
): Promise<string | null> => {
  try {
    // Validate the entry data
    const validationResult = validateTimeEntry(entryData);
    
    if (!validationResult.valid) {
      logger.warn('Invalid time entry data:', validationResult.errors);
      
      dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { 
          context: 'createTimeEntry', 
          errors: validationResult.errors
        }
      });
      
      return null;
    }
    
    // Create a new entry with an ID
    const newEntryId = uuidv4();
    const newEntry: TimeEntry = {
      ...entryData,
      id: newEntryId
    };
    
    // Add to entries
    const updatedEntries = [...allEntries, newEntry];
    
    // Save to storage
    const savedSuccessfully = await saveEntriesToStorage(updatedEntries, storageKey, deletedEntryIds);
    
    if (!savedSuccessfully) {
      logger.error('Failed to save new entry to storage');
      
      dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { 
          context: 'createTimeEntry', 
          message: 'Failed to save entry to storage'
        }
      });
      
      return null;
    }
    
    // Dispatch event
    dispatchEvent({
      type: 'entry-created',
      timestamp: new Date(),
      payload: { entry: newEntry }
    });
    
    return newEntryId;
  } catch (error) {
    logger.error('Error creating time entry:', error);
    
    dispatchEvent({
      type: 'error',
      timestamp: new Date(),
      payload: { 
        context: 'createTimeEntry',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    return null;
  }
};
