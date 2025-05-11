
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../../errors";
import { DELETED_ENTRIES_KEY } from "../storage-operations";
import { addToDeletedEntries, loadEntriesFromStorage, saveEntriesToStorage, STORAGE_KEY } from "../storage-operations";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig, TimeEntryEventType } from "./types";
import { timeEventsService } from "../../events/timeEventsService";
import { toilService } from "../toil/service";

const logger = createTimeLogger('DeleteOperations');

/**
 * Class to handle deletion operations on time entries
 */
export class DeleteOperations {
  private eventManager: EventManager;
  private serviceName: string;
  private storageKey: string;
  private config: TimeEntryOperationsConfig;
  
  constructor(
    eventManager: EventManager,
    config: TimeEntryOperationsConfig = {}
  ) {
    this.eventManager = eventManager;
    this.serviceName = config.serviceName ?? "TimeEntryService";
    this.storageKey = config.storageKey ?? STORAGE_KEY;
    this.config = config;
    
    logger.debug(`DeleteOperations initialized for ${this.serviceName}`);
  }
  
  /**
   * Delete a time entry by its ID
   * @param id The ID of the entry to delete
   * @returns true if deleted successfully, false otherwise
   */
  public async deleteEntryById(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting entry with ID: ${id}`);
      console.log(`[DeleteOperations] Deleting entry with ID: ${id}`);
      
      // Load all entries
      const allEntries = loadEntriesFromStorage(STORAGE_KEY);
      
      // Find the entry before deleting it
      const entryToDelete = allEntries.find(entry => entry.id === id);
      
      // If entry doesn't exist, return early
      if (!entryToDelete) {
        logger.warn(`Entry with ID ${id} not found for deletion`);
        console.warn(`[DeleteOperations] Entry with ID ${id} not found for deletion`);
        return false;
      }
      
      // Log details about the entry being deleted
      console.log(`[DeleteOperations] Found entry to delete:`, {
        id: entryToDelete.id,
        userId: entryToDelete.userId,
        date: entryToDelete.date,
        jobNumber: entryToDelete.jobNumber
      });
      
      // Now also try to delete any associated TOIL records
      try {
        if (entryToDelete.jobNumber === "TOIL") {
          console.log(`[DeleteOperations] Entry is a TOIL usage entry, will need to update TOIL records`);
        }
        
        // For any entry, check if there are TOIL records using it as a reference
        console.log(`[DeleteOperations] Checking for TOIL records linked to entry ID: ${id}`);
      } catch (error) {
        logger.error(`Error during TOIL record cleanup for entry ${id}:`, error);
        console.error(`[DeleteOperations] Error during TOIL record cleanup for entry ${id}:`, error);
      }
      
      // Remove the entry from the array
      const filteredEntries = allEntries.filter(entry => entry.id !== id);
      
      // Load existing deleted entries
      const deletedEntries = await addToDeletedEntries(id);
      
      // Save the updated entries array
      const saved = await saveEntriesToStorage(filteredEntries, STORAGE_KEY, deletedEntries);
      
      if (saved) {
        logger.debug(`Entry ${id} deleted successfully`);
        console.log(`[DeleteOperations] Entry ${id} deleted successfully`);
        
        // Dispatch event
        this.eventManager.dispatchEvent({
          type: 'delete' as TimeEntryEventType,
          timestamp: new Date(),
          payload: { id, entry: entryToDelete }
        });
        
        // Also dispatch through the improved event service
        timeEventsService.publish('entry-deleted', {
          id,
          userId: entryToDelete.userId,
          entryId: id
        });
        
        return true;
      }
      
      logger.error(`Failed to save entries after deleting ${id}`);
      console.error(`[DeleteOperations] Failed to save entries after deleting ${id}`);
      return false;
      
    } catch (error) {
      logger.error(`Error deleting entry ${id}:`, error);
      console.error(`[DeleteOperations] Error deleting entry ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Delete entry adapter method for compatibility with TimeEntryBaseOperations
   */
  public async deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean> {
    try {
      return await this.deleteEntryById(entryId);
    } catch (error) {
      logger.error('Failed to delete entry:', error);
      return false;
    }
  }
}
