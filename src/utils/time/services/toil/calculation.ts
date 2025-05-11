
import { TimeEntry, WorkSchedule } from "@/types";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { TOILRecord } from "@/types/toil";
import { isValidTOILHours } from "../../validation/toilValidation";
import { createTimeLogger } from "../../errors/timeLogger";
import { isHoliday } from "./holiday-utils";
import { calculateDayHoursWithBreaks } from "../../scheduleUtils";

const logger = createTimeLogger('TOILCalculation');

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
    
    // Filter only entries for this user and date
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEntries = entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === dateString && entry.userId === userId;
    });

    if (!dayEntries.length) {
      logger.debug(`No entries for ${dateString} for user ${userId}`);
      return null;
    }
    
    // IMPORTANT: Filter out synthetic TOIL entries to prevent circular calculation
    const nonToilEntries = dayEntries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
    
    if (nonToilEntries.length === 0) {
      logger.debug(`Only synthetic TOIL entries found for ${dateString}, skipping TOIL calculation`);
      return null;
    }
    
    // Check if it's a holiday or weekend
    const isHolidayDay = isHoliday(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday
    
    if (isHolidayDay) {
      logger.debug(`${dateString} is a holiday, all hours are TOIL`);
    }
    
    if (isWeekend) {
      logger.debug(`${dateString} is a weekend (${date.getDay()}), all hours are TOIL`);
    }
    
    // Get scheduled hours from work schedule
    const dayOfWeek = date.getDay();
    const weekNumber = Math.floor(date.getDate() / 7);
    let scheduledHours = 0;
    
    try {
      // Calculate scheduled hours for the day based on work schedule
      const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      const week = weekNumber % 2; // Alternate between 0 and 1 for fortnight
      const dayConfig = workSchedule.weeks[week]?.[weekday];
      
      if (dayConfig && dayConfig.startTime && dayConfig.endTime) {
        scheduledHours = calculateDayHoursWithBreaks(
          dayConfig.startTime, 
          dayConfig.endTime, 
          { 
            lunch: !!dayConfig.breaks?.lunch, 
            smoko: !!dayConfig.breaks?.smoko 
          }
        );
        
        logger.debug(`Calculated scheduled hours for ${dateString}: ${scheduledHours} from schedule`, { 
          startTime: dayConfig.startTime,
          endTime: dayConfig.endTime,
          breaks: dayConfig.breaks
        });
      }
      
      logger.debug(`Scheduled hours for ${dateString}: ${scheduledHours}`);
    } catch (error) {
      logger.error('Error calculating scheduled hours:', error);
      scheduledHours = 7.6; // Default full-day hours
    }
    
    // Calculate total hours worked from non-TOIL entries only
    const totalHours = nonToilEntries.reduce((sum, entry) => sum + entry.hours, 0);
    logger.debug(`Total hours for ${dateString}: ${totalHours}`);
    
    // FIXED: Only count hours over scheduled hours as TOIL, unless weekend or holiday
    // For holidays or weekends, count all hours as TOIL
    const toilHours = (isHolidayDay || isWeekend) ? totalHours : Math.max(0, totalHours - scheduledHours);
    
    // Enhanced logging for better debugging
    logger.debug(`
      TOIL calculation details: 
      - Date: ${dateString}
      - User: ${userId}
      - Total hours worked: ${totalHours}
      - Scheduled hours: ${scheduledHours}
      - Is holiday: ${isHolidayDay}
      - Is weekend: ${isWeekend}
      - TOIL hours (difference): ${toilHours}
    `);
    
    // Round to nearest quarter hour
    const roundedToilHours = Math.round(toilHours * 4) / 4;
    logger.debug(`Rounded TOIL hours for ${dateString}: ${roundedToilHours}`);
    
    // Validate TOIL hours - add slightly more precision to tolerance
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
      entryId: primaryEntry.id,  
      status: 'active'
    };
    
    logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
    
    return toilRecord;
  } catch (error) {
    logger.error(`Error calculating daily TOIL: ${error instanceof Error ? error.message : String(error)}`, error);
    return null;
  }
}

/**
 * Calculate TOIL hours for a set of time entries
 * This is a wrapper around calculateDailyTOIL that extracts just the hours
 */
export const calculateTOILHours = (
  entries: TimeEntry[],
  date: Date,
  workSchedule: WorkSchedule,
  holidays: any[] = []
): number => {
  try {
    // First check if this is a holiday
    const isHolidayDay = isHoliday(date, holidays);
    
    // Get the user ID from the first entry (they should all be the same)
    const userId = entries[0]?.userId;
    if (!userId) return 0;
    
    const record = calculateDailyTOIL(entries, date, userId, workSchedule);
    return record ? record.hours : 0;
  } catch (error) {
    logger.error(`Error in calculateTOILHours: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
};

/**
 * Create a helper for holiday utility (in case the imported one is missing)
 */
export const isWeekendOrHoliday = (date: Date, holidays: any[] = []): boolean => {
  // Check if it's a weekend (0 = Sunday, 6 = Saturday)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  // Check if it's a defined holiday
  const isHolidayDay = isHoliday(date, holidays);
  
  return isWeekend || isHolidayDay;
};
