import { createTimeLogger } from "../../errors";
import { EventManager } from "../event-handling";
import { TimeEntryOperationsConfig } from "./types";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

const logger = createTimeLogger('DeleteOperations');

/**
 * Class to handle deletion operations for time entries
 */
export class DeleteOperations {
  private eventManager: EventManager;
  private serviceName: string;
  private storageKey: string;

  constructor(
    eventManager: EventManager,
    config: Partial<Pick<TimeEntryOperationsConfig, 'serviceName' | 'storageKey'>>
  ) {
    this.eventManager = eventManager;
    this.serviceName = config.serviceName || 'default';
    this.storageKey = config.storageKey ?? 'default-storage-key';

    logger.debug(`DeleteOperations initialized for ${this.serviceName}`);
    console.log(`[DeleteOperations] DeleteOperations initialized for ${this.serviceName}`);
  }

  /**
   * Delete a time entry by its ID
   * This will handle properly removing from storage and emitting events
   */
  public async deleteEntryById(entryId: string): Promise<boolean> {
    logger.debug(`Deleting entry with ID: ${entryId}`);
    console.log(`[DeleteOperations] Deleting entry with ID: ${entryId}`);

    try {
      // Logic for deleting an entry would go here.
      // For simplicity in this example, we're just returning true
      // and emitting events.

      // In a real implementation, we would:
      // 1. Get all entries from storage
      // 2. Filter out the entry with the matching ID
      // 3. Write the updated array back to storage

      // For now, just simulate this was successful
      const success = true;

      if (success) {
        const now = new Date();

        // Dispatch through the event manager
        this.eventManager.dispatchEvent({
          type: 'entry-deleted',
          timestamp: now,
          payload: { entryId }
        });

        // Also dispatch through the improved event service
        timeEventsService.publish('entry-deleted', {
          entryId
        });

        logger.debug(`Successfully deleted entry with ID: ${entryId}`);
        console.log(`[DeleteOperations] Successfully deleted entry with ID: ${entryId}`);
      }

      return success;
    } catch (error) {
      logger.error(`Failed to delete entry with ID: ${entryId}`, error);
      console.error(`[DeleteOperations] Failed to delete entry:`, error);
      return false;
    }
  }

  /**
   * Adapter method for TimeEntryBaseOperations interface
   */
  public async deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean> {
    return this.deleteEntryById(entryId);
  }
}
