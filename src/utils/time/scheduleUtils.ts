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
