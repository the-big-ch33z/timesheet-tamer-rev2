
import { TimeEntry } from "@/types";
import { saveEntriesToStorage } from "../storage-operations";
import { createTimeLogger } from "../../errors/timeLogger";
import { dispatchEntryEvent, dispatchErrorEvent } from "./event-utils";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { v4 as uuidv4 } from "uuid";

const logger = createTimeLogger('CreateOperations');

export class CreateOperations {
  constructor(
    private config: Required<TimeEntryOperationsConfig>,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {}

  public async createEntry(entry: Partial<TimeEntry>, deletedEntryIds: string[]): Promise<string | null> {
    try {
      const allEntries = this.getAllEntries();
      
      // Generate ID if not provided
      const newId = entry.id || uuidv4();
      
      // Create new entry
      const newEntry: TimeEntry = {
        id: newId,
        userId: entry.userId || 'unknown',
        date: entry.date || new Date(),
        hours: typeof entry.hours === 'number' ? entry.hours : 0,
        description: entry.description || '',
        entryType: entry.entryType || 'manual',
        jobNumber: entry.jobNumber || '',
        project: entry.project || '',
        synthetic: !!entry.synthetic,
        created: new Date(),
        updated: new Date()
      };
      
      // Add to collection
      allEntries.push(newEntry);
      
      try {
        // Save to storage
        const saved = await saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds);
        
        if (!saved) {
          logger.error(`Failed to save after creating entry ${newId}`);
          return null;
        }
        
        // Invalidate cache
        this.invalidateCache();
        
        // Dispatch events
        dispatchEntryEvent(this.eventManager, 'entry-created', { entryId: newId, entry: newEntry }, newEntry.userId);
        
        // Also dispatch DOM event for legacy code
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('timesheet:entry-created', {
            detail: { entry: newEntry }
          }));
        }
        
        return newId;
      } catch (saveError) {
        logger.error(`Error saving after creating entry:`, saveError);
        dispatchErrorEvent(this.eventManager, saveError, 'createEntry');
        return null;
      }
    } catch (error) {
      logger.error(`Error creating entry`, error);
      dispatchErrorEvent(this.eventManager, error, 'createEntry');
      return null;
    }
  }
}
