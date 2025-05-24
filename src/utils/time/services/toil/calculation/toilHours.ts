
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
 * ENHANCED: Improved logging and work schedule validation
 */
export function calculateTOILHours(
  entries: TimeEntry[],
  date: Date,
  workSchedule: WorkSchedule, 
  holidays: any[] = []
): number {
  try {
    const dateString = format(date, 'yyyy-MM-dd');
    logger.debug(`=== TOIL CALCULATION START for ${dateString} ===`);
    
    // Filter only entries for the date
    const dayEntries = filterEntriesForDate(entries, date);
    logger.debug(`Filtered ${dayEntries.length} entries for date ${dateString} from ${entries.length} total entries`);

    if (!dayEntries.length) {
      logger.debug(`No entries for date ${dateString} - returning 0 TOIL hours`);
      return 0;
    }
    
    // Filter out synthetic TOIL entries to prevent circular calculation
    const nonToilEntries = filterOutSyntheticTOIL(dayEntries);
    logger.debug(`After filtering TOIL entries: ${nonToilEntries.length} regular entries remaining`);
    
    if (nonToilEntries.length === 0) {
      logger.debug(`Only synthetic TOIL entries found for ${dateString}, skipping TOIL calculation`);
      return 0;
    }
    
    // ENHANCED: Better work schedule validation and logging
    if (!workSchedule) {
      logger.warn(`No work schedule provided for TOIL calculation on ${dateString} - using fallback logic`);
    } else {
      logger.debug(`Using work schedule: ${workSchedule.name} (ID: ${workSchedule.id})`);
    }
    
    // Check if it's a holiday, weekend or RDO
    const { isHolidayDay, isWeekend, isRDO } = isSpecialDay(date, workSchedule);
    logger.debug(`Special day check: holiday=${isHolidayDay}, weekend=${isWeekend}, RDO=${isRDO}`);
    
    // Get the scheduled hours for the day
    const scheduledHours = getScheduledHours(date, workSchedule);
    logger.debug(`Scheduled hours for ${dateString}: ${scheduledHours}`);
    
    // Calculate total hours worked from non-TOIL entries only
    const totalHours = calculateTotalHours(nonToilEntries);
    logger.debug(`Total hours worked: ${totalHours}`);
    
    // Count all hours as TOIL if it's a holiday, weekend, or RDO day
    const toilHours = (isHolidayDay || isWeekend || isRDO) 
      ? totalHours 
      : Math.max(0, totalHours - scheduledHours);
    
    // ENHANCED: More detailed logging
    logger.debug(`
      === TOIL CALCULATION DETAILS ===
      Date: ${dateString}
      Work Schedule: ${workSchedule?.name || 'None'}
      Total hours worked: ${totalHours}
      Scheduled hours: ${scheduledHours}
      Is holiday: ${isHolidayDay}
      Is weekend: ${isWeekend}
      Is RDO: ${isRDO}
      Raw TOIL hours: ${toilHours}
      Entries processed: ${nonToilEntries.map(e => `${e.id}:${e.hours}h`).join(', ')}
      === END CALCULATION DETAILS ===
    `);
    
    // Round to nearest quarter hour and validate
    const roundedToilHours = roundAndValidateHours(toilHours);
    
    logger.debug(`Final TOIL hours after rounding: ${roundedToilHours}`);
    logger.debug(`=== TOIL CALCULATION END ===`);
    
    return roundedToilHours;
  } catch (error) {
    logger.error(`Error in calculateTOILHours: ${error instanceof Error ? error.message : String(error)}`, error);
    return 0;
  }
}
