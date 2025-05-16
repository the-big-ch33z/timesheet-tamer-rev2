
import { TimeEntry, WorkSchedule } from "@/types";
import { isValidTOILHours } from "@/utils/time/validation/toilValidation";
import { createTimeLogger } from "@/utils/time/errors";
import { isHoliday } from "../holiday-utils";
import { 
  calculateDayHoursWithBreaks,
  getFortnightWeek,
  getWeekDay,
  isRDODay
} from "@/utils/time/scheduleUtils";
import { format as dateFnsFormat } from "date-fns";

const logger = createTimeLogger('TOILUtils');

/**
 * Filter time entries for a specific date
 */
export function filterEntriesForDate(entries: TimeEntry[], date: Date): TimeEntry[] {
  const dateString = dateFnsFormat(date, 'yyyy-MM-dd');
  return entries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return dateFnsFormat(entryDate, 'yyyy-MM-dd') === dateString;
  });
}

/**
 * Filter out synthetic TOIL entries to prevent circular calculation
 */
export function filterOutSyntheticTOIL(entries: TimeEntry[]): TimeEntry[] {
  return entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
}

/**
 * Check if the given date is a special day (holiday, weekend, or RDO)
 */
export function isSpecialDay(date: Date, workSchedule: WorkSchedule): {
  isHolidayDay: boolean;
  isWeekend: boolean;
  isRDO: boolean;
} {
  const isHolidayDay = isHoliday(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday
  const isRDO = isRDODay(date, workSchedule);
  
  return { isHolidayDay, isWeekend, isRDO };
}

/**
 * Calculate scheduled hours for a given day based on work schedule
 */
export function getScheduledHours(
  date: Date, 
  workSchedule: WorkSchedule
): number {
  try {
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    
    if (dayConfig && dayConfig.startTime && dayConfig.endTime) {
      return calculateDayHoursWithBreaks(
        dayConfig.startTime, 
        dayConfig.endTime, 
        { 
          lunch: !!dayConfig.breaks?.lunch, 
          smoko: !!dayConfig.breaks?.smoko 
        }
      );
    }
    
    return 0; // No hours scheduled
  } catch (error) {
    logger.error('Error calculating scheduled hours:', error);
    return 7.6; // Default full-day hours
  }
}

/**
 * Format date for logging and display
 */
export function format(date: Date, formatStr: string): string {
  // Use date-fns format directly to ensure consistency
  return dateFnsFormat(date, formatStr);
}

/**
 * Calculate total hours worked from entries
 */
export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
}

/**
 * Round hours to nearest quarter hour and validate
 */
export function roundAndValidateHours(hours: number): number {
  const roundedHours = Math.round(hours * 4) / 4;
  return isValidTOILHours(roundedHours) && roundedHours > 0.01 ? roundedHours : 0;
}
