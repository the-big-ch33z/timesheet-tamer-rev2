
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from "@/utils/time/errors";
import {
  getScheduledHours,
  isSpecialDay,
  format,
  filterOutSyntheticTOIL,
  filterEntriesForDate,
  roundAndValidateHours
} from "./utils";

const logger = createTimeLogger('TOILCalculation');

interface CalculateTOILOptions {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  userId: string;
}

/**
 * Calculate TOIL hours for a specific day
 * 
 * TOIL is earned when:
 * 1. Working on a special day (holiday, weekend, or RDO)
 * 2. Working more than scheduled hours on a regular day
 * 
 * @param options.entries - Time entries for the day
 * @param options.date - The day to calculate TOIL for
 * @param options.workSchedule - User's work schedule
 * @param options.userId - User ID
 * @returns The number of TOIL hours earned, or 0 if none
 */
export function calculateDailyTOIL({
  entries,
  date,
  workSchedule,
  userId
}: CalculateTOILOptions): number {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    logger.debug(`[${format(date, 'yyyy-MM-dd')}] No entries, no TOIL earned`);
    return 0;
  }
  
  if (!workSchedule) {
    logger.debug(`[${format(date, 'yyyy-MM-dd')}] No work schedule, defaulting to standard hours`);
  }
  
  // Filter entries for the day and remove synthetic TOIL entries
  const dailyEntries = filterOutSyntheticTOIL(
    filterEntriesForDate(entries, date)
  );
  
  if (dailyEntries.length === 0) {
    logger.debug(`[${format(date, 'yyyy-MM-dd')}] No valid entries for day, no TOIL earned`);
    return 0;
  }
  
  // Calculate total hours worked
  const totalHoursWorked = dailyEntries.reduce(
    (total, entry) => total + (entry.hours || 0), 
    0
  );
  
  // Safety check
  if (isNaN(totalHoursWorked) || totalHoursWorked <= 0) {
    logger.debug(`[${format(date, 'yyyy-MM-dd')}] Invalid total hours (${totalHoursWorked}), no TOIL earned`);
    return 0;
  }
  
  // Get scheduled hours for the day
  const scheduledHours = workSchedule 
    ? getScheduledHours(date, workSchedule)
    : 7.6; // Default to standard day if no schedule
  
  // Check if this is a special day (holiday, weekend, RDO)
  const { isHolidayDay, isWeekend, isRDO } = isSpecialDay(date, workSchedule || { weeks: [] });
  const isSpecialWorkDay = isHolidayDay || isWeekend || isRDO;
  
  logger.debug(
    `[${format(date, 'yyyy-MM-dd')}] Hours worked: ${totalHoursWorked.toFixed(2)}, ` +
    `Scheduled hours: ${scheduledHours.toFixed(2)}, ` +
    `Special day: ${isSpecialWorkDay} (Holiday: ${isHolidayDay}, Weekend: ${isWeekend}, RDO: ${isRDO})`
  );
  
  // Calculate TOIL hours
  let toilHours = 0;
  
  if (isSpecialWorkDay) {
    // On special days, all hours worked earn TOIL
    toilHours = totalHoursWorked;
    logger.debug(`[${format(date, 'yyyy-MM-dd')}] Special day, all ${toilHours.toFixed(2)} hours earn TOIL`);
  } else {
    // On regular days, only hours worked beyond scheduled hours earn TOIL
    toilHours = Math.max(0, totalHoursWorked - scheduledHours);
    logger.debug(
      `[${format(date, 'yyyy-MM-dd')}] Regular day, excess hours: ${toilHours.toFixed(2)} ` +
      `(${totalHoursWorked.toFixed(2)} - ${scheduledHours.toFixed(2)})`
    );
  }
  
  // Round to nearest quarter hour and validate
  const finalTOILHours = roundAndValidateHours(toilHours);
  
  logger.debug(
    `[${format(date, 'yyyy-MM-dd')}] Final TOIL hours: ${finalTOILHours.toFixed(2)} ` +
    `(rounded from ${toilHours.toFixed(2)})`
  );
  
  return finalTOILHours;
}
