
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary } from "@/types/toil";
import { calculateTOILHours } from "./calculation";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from "@/utils/time/errors";
import { storeTOILRecord, cleanupDuplicateTOILRecords } from "./storage";
import { toilService } from "./service/main";

const logger = createTimeLogger('TOIL-Batch-Processing');

/**
 * Perform a single TOIL calculation for a specific day
 * 
 * @param entries Time entries for the day
 * @param date Date to calculate TOIL for
 * @param userId User ID
 * @param workSchedule Work schedule for the user
 * @param holidays Holidays list
 * @returns TOIL summary for the month containing the calculated day
 */
export async function performSingleCalculation(
  entries: TimeEntry[],
  date: Date,
  userId: string,
  workSchedule: WorkSchedule,
  holidays: Holiday[]
): Promise<TOILSummary | null> {
  try {
    logger.debug(`Performing single TOIL calculation for ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
    
    // Filter out synthetic TOIL entries
    const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
    
    if (nonToilEntries.length === 0) {
      logger.debug('No non-TOIL entries found, skipping calculation');
      return toilService.getTOILSummary(userId, format(date, 'yyyy-MM'));
    }
    
    // Calculate TOIL hours
    const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
    
    if (toilHours === 0) {
      logger.debug('No TOIL hours calculated');
      return toilService.getTOILSummary(userId, format(date, 'yyyy-MM'));
    }
    
    // Create and store TOIL record
    const monthYear = format(date, 'yyyy-MM');
    const toilRecord = {
      id: uuidv4(),
      userId,
      date: new Date(date),
      hours: toilHours,
      monthYear,
      entryId: nonToilEntries[0].id,
      status: 'active' as 'active' | 'expired' | 'used' // Fix: type assertion for status
    };
    
    const stored = await storeTOILRecord(toilRecord);
    
    if (!stored) {
      logger.error('Failed to store TOIL record');
      return null;
    }
    
    // Clean up duplicate records
    await cleanupDuplicateTOILRecords(userId);
    
    // Return updated summary
    return toilService.getTOILSummary(userId, monthYear);
  } catch (error) {
    logger.error('Error in performSingleCalculation:', error);
    return null;
  }
}
