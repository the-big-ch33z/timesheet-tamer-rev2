import { 
  TOILRecord, TOILSummary
} from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  storeTOILRecord,
  cleanupDuplicateTOILRecords,
  filterRecordsByDate,
  storeTOILSummary
} from "../storage";
import { TOILServiceCore } from "./core";
import { calculateTOILHours } from "../calculation";
import { dispatchTOILEvent } from "../events";
import { loadTOILRecords } from "../storage/core";
import { queueTOILCalculation } from "../queue";

const logger = createTimeLogger('TOILService-Calculation');

/**
 * TOIL calculation functionality
 */
export class TOILServiceCalculation extends TOILServiceCore {
  // Track already processed dates to avoid redundant calculations
  private processedDates = new Map<string, number>();

  /**
   * Calculate and store TOIL for a given day
   */
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule: WorkSchedule,
    holidays: Holiday[]
  ): Promise<TOILSummary | null> {
    try {
      // Apply debouncing to prevent duplicate calculations
      if (this.shouldDebounceOperation()) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      
      // Generate a key for this specific calculation
      const dateKey = format(date, 'yyyy-MM-dd');
      const calcKey = `${userId}-${dateKey}`;
      const now = Date.now();
      
      // Check if we've recently processed this exact date and user
      if (this.processedDates.has(calcKey)) {
        const lastProcess = this.processedDates.get(calcKey)!;
        if (now - lastProcess < 2000) { // Within 2 seconds
          logger.debug(`Recently calculated TOIL for ${calcKey}, skipping redundant calculation`);
          return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
        }
      }
      
      // Mark this date as processed
      this.processedDates.set(calcKey, now);
      
      // Clean old entries from the processed dates map (keep it under 100 entries)
      if (this.processedDates.size > 100) {
        const keysToDelete = [...this.processedDates.keys()]
          .sort((a, b) => (this.processedDates.get(a) || 0) - (this.processedDates.get(b) || 0))
          .slice(0, 50);
          
        keysToDelete.forEach(key => this.processedDates.delete(key));
      }
      
      logger.debug(`calculateAndStoreTOIL called for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
      // Validate inputs
      if (!entries || entries.length === 0) {
        logger.debug('No entries to calculate TOIL for');
        return null;
      }
      
      if (!userId) {
        logger.error('Missing userId for TOIL calculation');
        return null;
      }
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      
      // Check if TOIL records already exist for this day
      const existingRecords = await loadTOILRecords(userId);
      const existingDayRecords = filterRecordsByDate(existingRecords, date);
      
      // Calculate TOIL hours based on real entries, not synthetic ones
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM')); // Return existing summary
      }
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Create a new TOIL record
      const toilRecord: TOILRecord = {
        id: uuidv4(),
        userId: userId,
        date: new Date(date), // Ensure date is a Date object
        hours: toilHours,
        monthYear: monthYear,
        entryId: nonToilEntries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record using our enhanced function that handles duplicates
      const stored = await storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        return null;
      }
      
      logger.debug('TOIL record stored successfully, cleaning up duplicates');
      
      // Run cleanup to remove any duplicate entries
      const removedCount = await cleanupDuplicateTOILRecords(userId);
      logger.debug(`Cleanup removed ${removedCount} duplicate records`);
      
      // Get updated summary
      const summary = this.getTOILSummary(userId, monthYear);
      
      logger.debug(`Updated TOIL summary: ${JSON.stringify(summary)}`);
      
      // Store the aggregated summary to localStorage
      if (summary) {
        try {
          storeTOILSummary(summary);
          logger.debug(`Stored TOIL summary to localStorage for ${userId} in ${monthYear}`);
        } catch (error) {
          logger.error(`Error storing TOIL summary: ${error}`);
        }
      }
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      return summary;
    } catch (error) {
      logger.error(`Error in calculateAndStoreTOIL: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  /**
   * Queue TOIL calculation
   */
  public queueCalculation(
    userId: string,
    date: Date,
    entries: TimeEntry[],
    workSchedule: WorkSchedule,
    holidays: Holiday[],
    resolve: (summary: TOILSummary | null) => void
  ): void {
    logger.debug(`Queueing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
    
    if (!this.calculationQueueEnabled) {
      logger.warn('TOIL calculation queue is disabled, processing immediately');
      this.processCalculation(userId, date, entries, workSchedule, holidays, resolve);
      return;
    }
    
    queueTOILCalculation({
      userId,
      date,
      entries,
      workSchedule,
      holidays,
      resolve
    });
  }

  /**
   * Process TOIL calculation immediately
   */
  private async processCalculation(
    userId: string,
    date: Date,
    entries: TimeEntry[],
    workSchedule: WorkSchedule,
    holidays: Holiday[],
    resolve: (summary: TOILSummary | null) => void
  ): Promise<void> {
    try {
      logger.debug(`Processing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
      // Apply debouncing to prevent duplicate calculations
      if (this.shouldDebounceOperation()) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        resolve(this.getTOILSummary(userId, format(date, 'yyyy-MM')));
        return;
      }
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        resolve(this.getTOILSummary(userId, monthYear));
        return;
      }
      
      // Calculate TOIL hours
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        resolve(this.getTOILSummary(userId, monthYear)); // Resolve with existing summary
        return;
      }
      
      // Create a new TOIL record
      const toilRecord: TOILRecord = {
        id: uuidv4(),
        userId: userId,
        date: date,
        hours: toilHours,
        monthYear: monthYear,
        entryId: nonToilEntries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record
      const stored = await storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        resolve(null);
        return;
      }
      
      // Run cleanup
      await cleanupDuplicateTOILRecords(userId);
      
      // Get updated summary - this is not a Promise, so no need for await
      const summary = this.getTOILSummary(userId, monthYear);
      
      // Store the aggregated summary to localStorage
      if (summary) {
        try {
          storeTOILSummary(summary);
          logger.debug(`Stored TOIL summary to localStorage for ${userId} in ${monthYear}`);
        } catch (error) {
          logger.error(`Error storing TOIL summary: ${error}`);
        }
      }
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      resolve(summary);
    } catch (error) {
      logger.error(`Error in processCalculation: ${error instanceof Error ? error.message : String(error)}`, error);
      resolve(null);
    }
  }
}
