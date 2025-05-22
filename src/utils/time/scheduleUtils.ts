
import { WorkSchedule } from "@/types";
import { format, getDay } from "date-fns";
import { autoCalculateHours } from "./services";
import { createTimeLogger } from "./errors";

const logger = createTimeLogger('scheduleUtils');

// Existing functions
export function getFortnightWeek(date: Date): number {
  // In a production environment, this would be more complex
  // based on pay periods. For now, using this simple calculation
  const weekNumber = Math.floor(date.getDate() / 7) % 2;
  return weekNumber === 0 ? 1 : 2;
}

export function getWeekDay(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[getDay(date)];
}

/**
 * Calculate daily scheduled hours from a work schedule for a specific date
 * @param date The date to calculate hours for
 * @param schedule The user's work schedule
 * @returns The scheduled hours for the day, or 0 if not found
 */
export function calculateDailyScheduledHours(date: Date, schedule: WorkSchedule): number {
  try {
    // Get the week and day
    const fortnightWeek = getFortnightWeek(date);
    const weekDay = getWeekDay(date);
    
    // Get day configuration from schedule
    const dayConfig = schedule.weeks[fortnightWeek]?.[weekDay];
    
    if (!dayConfig) {
      logger.debug(`No schedule configuration found for ${format(date, 'yyyy-MM-dd')} (${weekDay} in week ${fortnightWeek})`);
      return 0;
    }
    
    // If day is not a work day
    if (!dayConfig.startTime || !dayConfig.endTime) {
      logger.debug(`Not a scheduled work day: ${format(date, 'yyyy-MM-dd')}`);
      return 0;
    }
    
    // Calculate hours from start/end time
    const hours = autoCalculateHours(dayConfig.startTime, dayConfig.endTime);
    
    // Subtract breaks if defined
    let breakDeduction = 0;
    
    if (dayConfig.breaks) {
      if (dayConfig.breaks.lunch) breakDeduction += 0.5; // 30-min lunch break
      if (dayConfig.breaks.smoko) breakDeduction += 0.25; // 15-min smoko break
    }
    
    const netHours = Math.max(0, hours - breakDeduction);
    
    logger.debug(`Calculated scheduled hours for ${format(date, 'yyyy-MM-dd')}: ${netHours} hours`);
    return netHours;
  } catch (error) {
    logger.error(`Error calculating scheduled hours:`, error);
    return 0;
  }
}

/**
 * Calculate hours between two times with breaks consideration
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @param breaks Object specifying which breaks to deduct
 */
export function calculateDayHoursWithBreaks(
  startTime: string,
  endTime: string,
  breaks: { lunch?: boolean; smoko?: boolean }
): number {
  // Calculate base hours
  const baseHours = autoCalculateHours(startTime, endTime);
  
  // Deduct breaks if specified
  let breakDeduction = 0;
  if (breaks) {
    if (breaks.lunch) breakDeduction += 0.5; // 30 minutes for lunch
    if (breaks.smoko) breakDeduction += 0.25; // 15 minutes for smoko
  }
  
  return Math.max(0, baseHours - breakDeduction);
}

/**
 * Calculate hours for a day without break deductions
 */
export function calculateDayHours(startTime: string, endTime: string): number {
  return autoCalculateHours(startTime, endTime);
}

/**
 * Calculate total fortnight hours from a work schedule
 */
export function calculateFortnightHoursFromSchedule(schedule: WorkSchedule): number {
  let totalHours = 0;
  
  // Process both weeks in the fortnight
  for (const weekNum of [1, 2]) {
    // Process all days in the week
    const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    for (const day of weekDays) {
      // Skip RDO days
      if (schedule.rdoDays[weekNum].includes(day)) {
        continue;
      }
      
      // Get day configuration
      const dayConfig = schedule.weeks[weekNum]?.[day];
      if (dayConfig && dayConfig.startTime && dayConfig.endTime) {
        // Calculate hours for this day with breaks
        const dayHours = calculateDayHoursWithBreaks(
          dayConfig.startTime,
          dayConfig.endTime,
          {
            lunch: !!dayConfig.breaks?.lunch,
            smoko: !!dayConfig.breaks?.smoko
          }
        );
        
        totalHours += dayHours;
      }
    }
  }
  
  // Round to nearest 0.5
  return Math.round(totalHours * 2) / 2;
}

/**
 * Calculate number of workdays in a month
 */
export function getWorkdaysInMonth(month: Date): number {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  let workdays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Monday to Friday are workdays (1-5)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workdays++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workdays;
}

/**
 * Get schedule information for a specific day
 */
export function getDayScheduleInfo(date: Date, schedule: WorkSchedule) {
  const fortnightWeek = getFortnightWeek(date);
  const weekDay = getWeekDay(date);
  
  const dayConfig = schedule.weeks[fortnightWeek]?.[weekDay];
  const isRDO = schedule.rdoDays[fortnightWeek].includes(weekDay);
  
  return {
    fortnightWeek,
    weekDay,
    dayConfig,
    isRDO,
    isWorkDay: !!(dayConfig?.startTime && dayConfig?.endTime && !isRDO)
  };
}

/**
 * Check if a date is a working day based on schedule
 */
export function isWorkingDay(date: Date, schedule: WorkSchedule): boolean {
  const { isWorkDay } = getDayScheduleInfo(date, schedule);
  return isWorkDay;
}

/**
 * Check if a date is an RDO (rostered day off)
 */
export function isRDODay(date: Date, schedule: WorkSchedule): boolean {
  const { isRDO } = getDayScheduleInfo(date, schedule);
  return isRDO;
}

/**
 * Check if a date is a public holiday
 */
export function isHolidayDate(date: Date): boolean {
  // This would connect to a holiday service in production
  // For now, just returning false
  return false;
}

/**
 * Check if a date is a non-working day (weekend or holiday)
 */
export function isNonWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  
  return isWeekend || isHolidayDate(date);
}

/**
 * Clear internal holiday cache (for testing/refreshing)
 */
export function clearHolidayCache(): void {
  // In production, this would clear a cache of holiday data
  logger.debug("Holiday cache cleared");
}
