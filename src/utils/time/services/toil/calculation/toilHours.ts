
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  filterEntriesForDate, 
  filterOutSyntheticTOIL, 
  isSpecialDay, 
  getScheduledHours,
  calculateTotalHours,
  roundAndValidateHours
} from "./utils";

const logger = createTimeLogger('TOILCalculation-Hours');

/**
 * Calculate TOIL hours for a given set of time entries
 * FIXED: Properly handle RDO days, holidays, and weekends to accrue all hours as TOIL
 * FIXED: Use correct fortnight week calculation from scheduleUtils
 */
export function calculateTOILHours(
  entries: TimeEntry[],
  date: Date,
  workSchedule: WorkSchedule, 
  holidays: any[] = []
): number {
  try {
    // Filter only entries for the date
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEntries = filterEntriesForDate(entries, date);

    if (!dayEntries.length) {
      logger.debug(`No entries for date ${dateString}`);
      return 0;
    }
    
    // Filter out synthetic TOIL entries to prevent circular calculation
    const nonToilEntries = filterOutSyntheticTOIL(dayEntries);
    
    if (nonToilEntries.length === 0) {
      logger.debug(`Only synthetic TOIL entries found for ${dateString}, skipping TOIL calculation`);
      return 0;
    }
    
    // Check if it's a holiday, weekend or RDO
    const { isHolidayDay, isWeekend, isRDO } = isSpecialDay(date, workSchedule);
    
    // Get the scheduled hours for the day
    const scheduledHours = getScheduledHours(date, workSchedule);
    
    // Calculate total hours worked from non-TOIL entries only
    const totalHours = calculateTotalHours(nonToilEntries);
    
    // Count all hours as TOIL if it's a holiday, weekend, or RDO day
    const toilHours = (isHolidayDay || isWeekend || isRDO) ? totalHours : Math.max(0, totalHours - scheduledHours);
    
    // Add more detailed logging
    logger.debug(`
      TOIL hours calculation:
      - Date: ${dateString}
      - Total hours: ${totalHours}
      - Scheduled hours: ${scheduledHours}
      - Is holiday: ${isHolidayDay}
      - Is weekend: ${isWeekend}
      - Is RDO: ${isRDO}
      - TOIL hours: ${toilHours}
      - Entries count: ${nonToilEntries.length}
    `);
    
    // Round to nearest quarter hour and validate
    const roundedToilHours = roundAndValidateHours(toilHours);
    
    return roundedToilHours;
  } catch (error) {
    logger.error(`Error in calculateTOILHours: ${error instanceof Error ? error.message : String(error)}`, error);
    return 0;
  }
}
