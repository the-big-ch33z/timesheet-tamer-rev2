/**
 * Schedule utility functions
 * Functions for working with work schedules and calendar data
 */
import { WeekDay, WorkSchedule } from "@/types";
import { getDaysInMonth, isWeekend } from "date-fns";
import { Holiday } from "@/lib/holidays";
import { format } from "date-fns";

// Holiday cache for quick lookups
const holidayDateCache = new Map<string, boolean>();

// Helper function to get weekday from date
export const getWeekDay = (date: Date): WeekDay => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] as WeekDay;
};

// Helper function to determine fortnight week (1 or 2)
export const getFortnightWeek = (date: Date): 1 | 2 => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysSinceStart / 7);
  return ((weekNumber % 2) + 1) as 1 | 2;
};

/**
 * Gets the number of workdays (Monday-Friday) in the given month
 */
export function getWorkdaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  
  let workdays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    // Count days that are not weekends
    if (!isWeekend(currentDate)) {
      workdays++;
    }
  }
  
  return workdays;
}

/**
 * Get schedule information for the selected day
 * @param date The date to check
 * @param workSchedule Work schedule to check against
 * @returns Schedule information for the day
 */
export const getDayScheduleInfo = (date: Date, workSchedule?: WorkSchedule) => {
  if (!workSchedule) return null;
  
  const weekDay = getWeekDay(date);
  const weekNum = getFortnightWeek(date);
  
  // Check if it's an RDO
  const isRDO = workSchedule.rdoDays[weekNum].includes(weekDay);
  
  if (isRDO) {
    return { 
      isWorkingDay: false, 
      isRDO: true, 
      hours: null 
    };
  }
  
  // Get scheduled work hours for this day
  const scheduledHours = workSchedule.weeks[weekNum][weekDay];
  
  return {
    isWorkingDay: !!scheduledHours,
    isRDO: false,
    hours: scheduledHours
  };
};

/**
 * Check if a day is a working day according to the schedule
 * @param day The day to check
 * @param workSchedule The work schedule
 * @returns True if it's a working day
 */
export const isWorkingDay = (day: Date, workSchedule?: WorkSchedule): boolean => {
  if (!workSchedule) return true; // Default to working day if no schedule

  const weekDay = getWeekDay(day);
  const weekNum = getFortnightWeek(day);
  
  // Check if it's an RDO
  if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
    return false;
  }
  
  // Check if there are work hours defined for this day
  const hoursForDay = workSchedule.weeks[weekNum][weekDay];
  return hoursForDay !== null;
};

/**
 * Efficient holiday lookup 
 * @param date Date to check
 * @param holidays List of holidays
 * @returns True if the date is a holiday
 */
export const isHolidayDate = (date: Date, holidays: Holiday[] = []): boolean => {
  // Create a cache key from the date
  const dateString = format(date, 'yyyy-MM-dd');
  
  // Check cache first
  if (holidayDateCache.has(dateString)) {
    return holidayDateCache.get(dateString)!;
  }
  
  // Check for holiday match
  const isHoliday = holidays.some(holiday => holiday.date === dateString);
  
  // Cache result
  holidayDateCache.set(dateString, isHoliday);
  
  return isHoliday;
};

/**
 * Check if a day is a non-working day according to the schedule and holidays
 * @param date The day to check
 * @param workSchedule The work schedule
 * @param holidays Holiday list to check against
 * @returns True if it's a non-working day
 */
export const isNonWorkingDay = (date: Date, workSchedule?: WorkSchedule, holidays: Holiday[] = []): boolean => {
  if (!workSchedule) return false;
  
  // Check if it's a weekend
  if (isWeekend(date)) {
    return true;
  }
  
  // Check if it's a holiday - use optimized lookup
  if (isHolidayDate(date, holidays)) {
    return true;
  }
  
  const weekDay = getWeekDay(date);
  const weekNum = getFortnightWeek(date);
  
  // Check if it's an RDO
  if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
    return true;
  }
  
  // Get scheduled work hours for this day
  const scheduledHours = workSchedule.weeks[weekNum][weekDay];
  return !scheduledHours;
};

/**
 * Calculate hours for a work day accounting for breaks (lunch and smoko)
 */
export const calculateDayHoursWithBreaks = (
  startTime: string,
  endTime: string,
  breaks?: { lunch?: boolean; smoko?: boolean }
): number => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  // Calculate base hours
  let hours = (endHour + endMinute/60) - (startHour + startMinute/60);

  // Subtract unpaid lunch break if enabled
  if (breaks?.lunch) {
    hours -= 0.5; // 30 minutes
  }

  // Subtract unpaid smoko break if enabled
  if (breaks?.smoko) {
    hours -= 0.25; // 15 minutes
  }

  return Math.max(0, hours);
};

/**
 * Calculate hours for a work day accounting for lunch only
 */
export const calculateDayHours = (startTime: string, endTime: string, breaks?: { lunch?: boolean; smoko?: boolean }): number => {
  return calculateDayHoursWithBreaks(startTime, endTime, breaks);
};

/**
 * Calculate total hours for a fortnight based on the work schedule
 * @param workSchedule The work schedule
 * @returns Total hours in the fortnight
 */
export const calculateFortnightHoursFromSchedule = (workSchedule: WorkSchedule): number => {
  if (!workSchedule) return 0;
  
  let totalHours = 0;
  
  // Process each week in the schedule
  Object.entries(workSchedule.weeks).forEach(([weekNum, week]) => {
    const weekNumber = parseInt(weekNum) as 1 | 2;
    const rdoDaysForWeek = workSchedule.rdoDays[weekNumber];
    
    // Process each day in the week
    Object.entries(week).forEach(([day, dayConfig]) => {
      // Skip if it's a non-working day
      if (!dayConfig) {
        return;
      }
      
      // Skip if it's an RDO day
      if (rdoDaysForWeek.includes(day as WeekDay)) {
        return;
      }
      
      // ---- Use break-aware day hours utility ----
      const hours = calculateDayHoursWithBreaks(
        dayConfig.startTime,
        dayConfig.endTime,
        dayConfig.breaks
      );
      totalHours += hours;
    });
  });
  
  return totalHours;
};

/**
 * Clear any cached holiday data
 */
export const clearHolidayCache = () => {
  holidayDateCache.clear();
};
