
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';
import { loadEntriesFromStorage, saveEntriesToStorage } from "../storage-operations";
import { validateTimeEntry } from "../entry-validation";

const logger = createTimeLogger('CreateOperations');

export class CreateOperations {
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
    
    logger.debug(`CreateOperations initialized for ${this.serviceName}`);
    console.log(`[TOIL-DEBUG] CreateOperations initialized for ${this.serviceName}`);
  }

  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    console.log(`[TOIL-DEBUG] ==> CREATE ENTRY FLOW START`);
    console.log(`[TOIL-DEBUG] Entry data:`, {
      userId: entryData.userId,
      date: entryData.date,
      hours: entryData.hours,
      jobNumber: entryData.jobNumber,
      description: entryData.description
    });
    
    try {
      // Validate the entry
      const validation = validateTimeEntry(entryData);
      if (!validation.isValid) {
        console.log(`[TOIL-DEBUG] ❌ Entry validation failed:`, validation.errors);
        logger.error('Entry validation failed:', validation.errors);
        return null;
      }
      
      console.log(`[TOIL-DEBUG] ✅ Entry validation passed`);
      
      // Generate new ID
      const newId = uuidv4();
      const newEntry: TimeEntry = {
        ...entryData,
        id: newId,
        date: entryData.date instanceof Date ? entryData.date : new Date(entryData.date)
      };
      
      console.log(`[TOIL-DEBUG] ✅ Generated new entry with ID: ${newId}`);
      
      // Load current entries and add new one
      const currentEntries = loadEntriesFromStorage(this.storageKey, deletedEntryIds);
      const updatedEntries = [...currentEntries, newEntry];
      
      // Save to storage
      const saveSuccess = saveEntriesToStorage(updatedEntries, this.storageKey, deletedEntryIds);
      
      if (!saveSuccess) {
        console.log(`[TOIL-DEBUG] ❌ Failed to save new entry to storage`);
        logger.error('Failed to save new entry to storage');
        return null;
      }
      
      console.log(`[TOIL-DEBUG] ✅ New entry saved to storage successfully`);
      
      // Prepare event data
      const now = new Date();
      const eventData = {
        entryId: newId,
        userId: entryData.userId,
        timestamp: Date.now(),
        date: format(newEntry.date, 'yyyy-MM-dd'),
        monthYear: format(newEntry.date, 'yyyy-MM'),
        requiresRefresh: true,
        source: 'create-operations',
        entry: newEntry
      };
      
      console.log(`[TOIL-DEBUG] ==> DISPATCHING EVENTS for new entry ${newId}`, eventData);
      
      // Dispatch through event manager
      this.eventManager.dispatchEvent({
        type: 'entry-created',
        timestamp: now,
        payload: eventData
      });
      
      // Dispatch through time events service
      timeEventsService.publish('entry-created', eventData);
      
      // Dispatch through EventBus for wider notification
      eventBus.publish(TIME_ENTRY_EVENTS.CREATED, eventData, { debounce: 50 });
      
      // Also dispatch a TOIL calculation event to trigger TOIL updates
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        ...eventData,
        status: 'completed'
      }, { debounce: 50 });
      
      console.log(`[TOIL-DEBUG] ✅ All events dispatched for entry creation ${newId}`);
      console.log(`[TOIL-DEBUG] ==> CREATE ENTRY FLOW COMPLETE: ${newId}`);
      
      logger.debug(`Successfully created entry with ID: ${newId}`);
      
      return newId;
    } catch (error) {
      console.error(`[TOIL-DEBUG] ❌ CREATE ENTRY FLOW FAILED:`, error);
      logger.error('Failed to create entry:', error);
      return null;
    }
  }
}
