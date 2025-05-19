import { TOILUsage } from "@/types/toil";
import { TimeEntry } from "@/types";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  loadTOILUsage,
  storeTOILUsage,
  cleanupDuplicateTOILUsage
} from "../storage";
import { TOILServiceCore } from "./core";
import { dispatchTOILEvent } from "../events";

const logger = createTimeLogger('TOILService-Usage');

/**
 * TOIL usage functionality
 */
export class TOILServiceUsage extends TOILServiceCore {
  /**
   * Record TOIL usage
   */
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      // Apply debouncing to prevent duplicate calculations
      if (this.shouldDebounceOperation()) {
        logger.debug('Skipping duplicate TOIL usage record due to debounce');
        return true;
      }
      
      logger.debug(`Recording TOIL usage for entry: ${entry?.id}`);
      
      if (!entry) {
        logger.error('No entry provided for TOIL usage');
        return false;
      }
      
      // Skip if this entry is not a TOIL entry
      if (entry.jobNumber !== "TOIL") {
        logger.debug('Entry is not a TOIL entry, skipping usage recording');
        return false;
      }
      
      if (!entry.userId || !entry.date || typeof entry.hours !== 'number') {
        logger.error('Invalid TOIL entry data', { 
          hasUserId: !!entry.userId, 
          hasDate: !!entry.date, 
          hours: entry.hours 
        });
        return false;
      }
      
      // Enhanced error checking for TOIL usage amount
      if (entry.hours <= 0) {
        logger.error(`Invalid TOIL usage hours: ${entry.hours}. Must be positive.`);
        return false;
      }
      
      // Check if this is a duplicate operation by looking for existing usage
      const existingUsages = loadTOILUsage(entry.userId).filter(u => u.entryId === entry.id);
      
      if (existingUsages.length > 0) {
        logger.debug(`TOIL usage already recorded for entry ${entry.id}, skipping duplicate`);
        
        // Clean up any duplicate entries while we're here
        await cleanupDuplicateTOILUsage(entry.userId);
        return true;
      }
      
      logger.debug(`Creating new TOIL usage record for ${entry.hours} hours`);
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date instanceof Date ? entry.date : new Date(entry.date),
        hours: entry.hours,
        entryId: entry.id,
        monthYear: format(entry.date instanceof Date ? entry.date : new Date(entry.date), 'yyyy-MM')
      };
      
      // Use the improved storage function that prevents duplicates
      const stored = await storeTOILUsage(usage);
      
      if (stored) {
        logger.debug('TOIL usage stored successfully');
        
        // Get updated summary
        const summary = this.getTOILSummary(entry.userId, usage.monthYear);
        
        // Dispatch TOIL update event
        dispatchTOILEvent(summary);
        
        logger.debug(`Updated TOIL summary after usage recorded: ${JSON.stringify(summary)}`);
      } else {
        logger.error('Failed to store TOIL usage');
      }
      
      return stored;
    } catch (error) {
      logger.error(`Error recording TOIL usage: ${error instanceof Error ? error.message : String(error)}`, error);
      return false;
    }
  }
}
