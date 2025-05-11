
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../../errors";
import { v4 as uuidv4 } from "uuid";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig, TimeEntryEventType } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

const logger = createTimeLogger('CreateOperations');

/**
 * Class to handle creation operations for time entries
 */
export class CreateOperations {
  private eventManager: EventManager;
  private serviceName: string;
  private storageKey: string;
  
  constructor(
    eventManager: EventManager,
    config: TimeEntryOperationsConfig
  ) {
    this.eventManager = eventManager;
    this.serviceName = config.serviceName;
    this.storageKey = config.storageKey;
    
    logger.debug(`CreateOperations initialized for ${this.serviceName}`);
    console.log(`[CreateOperations] CreateOperations initialized for ${this.serviceName}`);
  }
  
  /**
   * Create a new time entry 
   */
  public createNewEntry(entry: Partial<TimeEntry>): TimeEntry {
    logger.debug(`Creating new time entry`, entry);
    console.log('[CreateOperations] Creating new time entry:', entry);
    
    const now = new Date();
    
    // Create a complete entry with defaults
    const newEntry: TimeEntry = {
      id: uuidv4(),
      userId: entry.userId || '',
      date: entry.date || now,
      jobNumber: entry.jobNumber || '',
      hours: entry.hours || 0,
      description: entry.description || '',
      updatedAt: now,
      // Don't include location or other properties not in TimeEntry type
      ...entry
    };
    
    logger.debug(`Created new entry with ID: ${newEntry.id}`);
    console.log(`[CreateOperations] Created new entry with ID: ${newEntry.id}`);
    
    // Dispatch event
    this.eventManager.dispatchEvent({
      type: 'create' as TimeEntryEventType,
      timestamp: now,
      payload: { entry: newEntry }
    });
    
    // Also dispatch through the improved event service
    timeEventsService.publish('entry-created', {
      id: newEntry.id,
      userId: newEntry.userId,
      entryId: newEntry.id
    });
    
    return newEntry;
  }
  
  /**
   * Create entry adapter method for compatibility with TimeEntryBaseOperations
   */
  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    try {
      const newEntry = this.createNewEntry(entryData);
      return newEntry.id;
    } catch (error) {
      logger.error('Failed to create entry:', error);
      return null;
    }
  }
}
