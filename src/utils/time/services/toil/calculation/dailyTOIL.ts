
import { TimeEntry, WorkSchedule } from "@/types";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { TOILRecord } from "@/types/toil";
import { isValidTOILHours } from "@/utils/time/validation/toilValidation";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  filterEntriesForDate, 
  filterOutSyntheticTOIL, 
  isSpecialDay, 
  getScheduledHours,
  calculateTotalHours,
  roundAndValidateHours
} from "./utils";

const logger = createTimeLogger('TOILCalculation-Daily');

/**
 * Calculate TOIL (Time Off In Lieu) for a given set of time entries for a day
 * 
 * This function will:
 * 1. Calculate the scheduled hours for the day
 * 2. Calculate the total hours worked
 * 3. Calculate the TOIL hours (hours worked - scheduled hours)
 * 4. Create a TOIL record if applicable
 * 
 * FIXED: Enhanced logging and validation to prevent incorrect TOIL calculation
 * FIXED: Only calculate TOIL for hours exceeding the scheduled hours
 * FIXED: Properly handle RDO days, holidays, and weekends to accrue all hours as TOIL
 * FIXED: Use correct fortnight week calculation from scheduleUtils
 */
export function calculateDailyTOIL(
  entries: TimeEntry[],
  date: Date, 
  userId: string,
  workSchedule: WorkSchedule
): TOILRecord | null {
  try {
    if (!entries?.length || !userId || !workSchedule) {
      logger.debug('Skipping TOIL calculation due to missing inputs', { entries, userId, hasWorkSchedule: !!workSchedule });
      return null;
    }
    
    // Filter only entries for this date
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEntries = filterEntriesForDate(entries, date);

    if (!dayEntries.length) {
      logger.debug(`No entries for ${dateString} for user ${userId}`);
      return null;
    }
    
    // Filter out synthetic TOIL entries to prevent circular calculation
    const nonToilEntries = filterOutSyntheticTOIL(dayEntries);
    
    if (nonToilEntries.length === 0) {
      logger.debug(`Only synthetic TOIL entries found for ${dateString}, skipping TOIL calculation`);
      return null;
    }
    
    // Check if it's a holiday, weekend, or RDO day
    const { isHolidayDay, isWeekend, isRDO } = isSpecialDay(date, workSchedule);
    
    if (isHolidayDay) {
      logger.debug(`${dateString} is a holiday, all hours are TOIL`);
    }
    
    if (isWeekend) {
      logger.debug(`${dateString} is a weekend (${date.getDay()}), all hours are TOIL`);
    }
    
    if (isRDO) {
      logger.debug(`${dateString} is an RDO day, all hours are TOIL`);
    }
    
    // Get scheduled hours from work schedule
    let scheduledHours = getScheduledHours(date, workSchedule);
    logger.debug(`Scheduled hours for ${dateString}: ${scheduledHours}`);
    
    // Calculate total hours worked from non-TOIL entries only
    const totalHours = calculateTotalHours(nonToilEntries);
    logger.debug(`Total hours for ${dateString}: ${totalHours}`);
    
    // Count all hours as TOIL if it's a holiday, weekend, or RDO day
    // For regular days, only count hours over scheduled hours as TOIL
    const toilHours = (isHolidayDay || isWeekend || isRDO) ? totalHours : Math.max(0, totalHours - scheduledHours);
    
    // Enhanced logging for better debugging
    logger.debug(`
      TOIL calculation details: 
      - Date: ${dateString}
      - User: ${userId}
      - Total hours worked: ${totalHours}
      - Scheduled hours: ${scheduledHours}
      - Is holiday: ${isHolidayDay}
      - Is weekend: ${isWeekend}
      - Is RDO: ${isRDO}
      - TOIL hours (difference): ${toilHours}
    `);
    
    // Round to nearest quarter hour
    const roundedToilHours = roundAndValidateHours(toilHours);
    logger.debug(`Rounded TOIL hours for ${dateString}: ${roundedToilHours}`);
    
    // Validate TOIL hours
    if (!isValidTOILHours(roundedToilHours) || roundedToilHours <= 0.01) {
      logger.debug(`No valid TOIL hours for ${dateString}`);
      return null;
    }

    // Find the first entry to use as reference (preferably the largest one)
    const primaryEntry = [...nonToilEntries].sort((a, b) => b.hours - a.hours)[0];

    // Create TOIL record
    const toilRecord: TOILRecord = {
      id: uuidv4(),
      userId,
      date: new Date(date),
      hours: roundedToilHours,
      monthYear: format(date, 'yyyy-MM'),
      entryId: primaryEntry.id,  // Link to the entry that generated this TOIL
      status: 'active'
    };
    
    logger.debug(`Created TOIL record for ${dateString}: ${roundedToilHours} hours`, toilRecord);
    return toilRecord;
  } catch (error) {
    logger.error(`Error in calculateDailyTOIL: ${error instanceof Error ? error.message : String(error)}`, error);
    return null;
  }
}
