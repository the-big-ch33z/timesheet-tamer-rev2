
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from "@/utils/time/errors";
import { Holiday } from "@/lib/holidays";
import { toilService } from "./service";
import { TOILSummary } from "@/types/toil";

const logger = createTimeLogger('TOIL-Batch-Processing');

/**
 * Process a batch of TOIL calculations for a specific day
 */
export async function processTOILBatch(
  entries: TimeEntry[],
  date: Date,
  userId: string,
  workSchedule?: WorkSchedule,
  holidays: Holiday[] = []
): Promise<TOILSummary | null> {
  try {
    logger.debug(`Processing TOIL batch for ${userId} on ${date.toDateString()}`);
    
    // Skip if no entries
    if (!entries || entries.length === 0) {
      logger.debug(`No entries for TOIL batch - skipping`);
      return null;
    }
    
    // Filter entries if needed
    const validEntries = entries.filter(entry => entry && typeof entry.hours === 'number');
    
    if (validEntries.length === 0) {
      logger.debug(`No valid entries for TOIL batch - skipping`);
      return null;
    }
    
    logger.debug(`Processing ${validEntries.length} entries for TOIL calculation`);
    
    // Run calculation
    return await toilService.calculateAndStoreTOIL(
      validEntries, 
      date, 
      userId,
      workSchedule,
      holidays
    );
  } catch (error) {
    logger.error('Error in TOIL batch processing:', error);
    return null;
  }
}

/**
 * Queue a batch of TOIL calculations to be processed asynchronously
 */
export function queueBatchCalculation(
  entries: TimeEntry[],
  date: Date,
  userId: string,
  workSchedule?: WorkSchedule,
  holidays: Holiday[] = []
): Promise<TOILSummary | null> {
  return new Promise((resolve) => {
    logger.debug(`Queuing TOIL batch for ${userId}`);
    
    // Process immediately for now
    processTOILBatch(entries, date, userId, workSchedule, holidays)
      .then(summary => {
        if (summary) {
          resolve(summary);
        } else {
          resolve(null);
        }
      })
      .catch(error => {
        logger.error('Error in queued batch calculation:', error);
        resolve(null);
      });
  });
}
