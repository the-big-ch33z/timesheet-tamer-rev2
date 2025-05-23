
import { TimeEntry, WorkSchedule } from "@/types";
import { format as dateFnsFormat } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { isValidTOILHours } from "@/utils/time/validation/toilValidation";
import { 
  calculateDayHoursWithBreaks,
  getWeekDay,
  getFortnightWeek,
  isRDODay
} from "@/utils/time/scheduleUtils";
import { isHoliday } from "../holiday-utils";

const logger = createTimeLogger('TOILCalculation-Utils');

/**
 * Format date to string in yyyy-MM-dd format
 */
export const format = (date: Date, formatStr: string): string => {
  return dateFnsFormat(date, formatStr);
};

/**
 * Filter entries for a specific date
 */
export const filterEntriesForDate = (entries: TimeEntry[], date: Date): TimeEntry[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return entries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return format(entryDate, 'yyyy-MM-dd') === dateString;
  });
};

/**
 * Filter out synthetic TOIL entries to prevent circular calculation
 */
export const filterOutSyntheticTOIL = (entries: TimeEntry[]): TimeEntry[] => {
  return entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
};

/**
 * Check if a date is a special day (holiday, weekend, or RDO)
 */
export const isSpecialDay = (date: Date, workSchedule: WorkSchedule) => {
  const isHolidayDay = isHoliday(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday
  const isRDO = isRDODay(date, workSchedule);
  
  return { isHolidayDay, isWeekend, isRDO };
};

/**
 * Get scheduled hours for a specific day from work schedule
 */
export const getScheduledHours = (date: Date, workSchedule: WorkSchedule): number => {
  try {
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    
    // Calculate scheduled hours based on work schedule
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
    
    return 7.6; // Default full-day hours if no schedule found
  } catch (error) {
    logger.error('Error calculating scheduled hours:', error);
    return 7.6; // Default hours on error
  }
};

/**
 * Calculate total hours from entries
 */
export const calculateTotalHours = (entries: TimeEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
};

/**
 * Round hours to nearest quarter hour and validate
 */
export const roundAndValidateHours = (hours: number): number => {
  // Round to nearest quarter hour
  const roundedHours = Math.round(hours * 4) / 4;
  
  // Don't return insignificant TOIL amounts (less than 0.01)
  return isValidTOILHours(roundedHours) && roundedHours > 0.01 ? roundedHours : 0;
};
