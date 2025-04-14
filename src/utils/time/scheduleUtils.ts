
import { WorkSchedule } from "@/types";
import { isSameDay, isSunday, isSaturday, format } from "date-fns";
import { createTimeLogger } from "./errors";

const logger = createTimeLogger('scheduleUtils');

/**
 * Get the status of a day (workday, weekend, holiday)
 */
export const getDayStatus = (
  day: Date, 
  workSchedule?: WorkSchedule
): 'workday' | 'weekend' | 'holiday' => {
  // Check if it's a weekend
  if (isSaturday(day) || isSunday(day)) {
    return 'weekend';
  }
  
  // Check if we have a work schedule
  if (!workSchedule || !workSchedule.holidays) {
    return 'workday';
  }
  
  // Check if it's a holiday
  const isHoliday = workSchedule.holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return isSameDay(day, holidayDate);
  });
  
  return isHoliday ? 'holiday' : 'workday';
};

/**
 * Gets the number of workdays in a month
 * Workdays are days that are not weekends or holidays
 */
export const getWorkdaysInMonth = (month: Date): number => {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  let workdays = 0;
  let currentDate = monthStart;
  
  while (currentDate <= monthEnd) {
    if (!isSaturday(currentDate) && !isSunday(currentDate)) {
      workdays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workdays;
};

/**
 * Get the target hours for a workday based on work schedule
 */
export const getWorkdayTargetHours = (
  workSchedule: WorkSchedule
): number => {
  // Default values
  if (!workSchedule) {
    logger.debug("No work schedule provided, using default target hours");
    return 7.6; // Default daily hours (approximation of 38 hours per week / 5 days)
  }
  
  // Try to get from standard hours in schedule
  if (workSchedule.standardHours && workSchedule.standardHours.dailyHours) {
    logger.debug(`Using standard daily hours from schedule: ${workSchedule.standardHours.dailyHours}`);
    return workSchedule.standardHours.dailyHours;
  }
  
  // Calculate from weekly or fortnightly
  if (workSchedule.standardHours && workSchedule.standardHours.weeklyHours) {
    const dailyFromWeekly = workSchedule.standardHours.weeklyHours / 5;
    logger.debug(`Calculated daily hours from weekly: ${dailyFromWeekly}`);
    return dailyFromWeekly;
  }
  
  if (workSchedule.standardHours && workSchedule.standardHours.fortnightlyHours) {
    const dailyFromFortnightly = workSchedule.standardHours.fortnightlyHours / 10;
    logger.debug(`Calculated daily hours from fortnightly: ${dailyFromFortnightly}`);
    return dailyFromFortnightly;
  }
  
  // If nothing else, return default
  logger.debug("Could not determine target hours from schedule, using default");
  return 7.6;
};
