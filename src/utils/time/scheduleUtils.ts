
/**
 * Work schedule utility functions
 */
import { WorkSchedule, WorkScheduleDayConfig } from '@/types';
import { format, isSameDay, isWeekend, isWithinInterval, addDays, getDaysInMonth } from 'date-fns';
import { createTimeLogger } from './errors/timeLogger';
import { isHoliday } from './services/toil/holiday-utils';

const logger = createTimeLogger('scheduleUtils');

// Cache for expensive calculations
const scheduleCache = new Map<string, any>();

/**
 * Clear the schedule utility caches
 */
export function clearScheduleCache(): void {
  scheduleCache.clear();
}

/**
 * Clear the holiday cache (used for testing and when holiday data updates)
 */
export function clearHolidayCache(): void {
  // Implementation would clear any holiday-related caches
}

/**
 * Get the day of week name (e.g., "monday", "tuesday")
 */
export function getWeekDay(date: Date): string {
  return format(date, 'EEEE').toLowerCase();
}

/**
 * Get fortnight week number (1 or 2) for a given date
 */
export function getFortnightWeek(date: Date): 1 | 2 {
  // ISO week numbering, then modulo 2 to get fortnight week
  const weekNumber = parseInt(format(date, 'w'), 10);
  return (weekNumber % 2 === 0) ? 2 : 1 as 1 | 2;
}

/**
 * Check if a date is a working day based on work schedule
 */
export function isWorkingDay(date: Date, workSchedule: WorkSchedule): boolean {
  const weekday = getWeekDay(date);
  const fortnightWeek = getFortnightWeek(date);
  
  // Check if this day has hours in the schedule
  const dayConfig = workSchedule.weeks[fortnightWeek][weekday];
  
  // Is this day an RDO?
  const isRdo = workSchedule.rdoDays[fortnightWeek].includes(weekday);
  
  // It's a working day if it has hours and is not an RDO
  return !!dayConfig && !isRdo;
}

/**
 * Check if a date is a Rostered Day Off
 */
export function isRDODay(date: Date, workSchedule: WorkSchedule): boolean {
  const weekday = getWeekDay(date);
  const fortnightWeek = getFortnightWeek(date);
  
  // Check if this weekday is listed in RDO days
  return workSchedule.rdoDays[fortnightWeek].includes(weekday);
}

/**
 * Check if a date is a holiday
 */
export function isHolidayDate(date: Date, holidays?: any[]): boolean {
  return isHoliday(date, holidays);
}

/**
 * Check if a date is a non-working day (weekend, holiday, or RDO)
 */
export function isNonWorkingDay(date: Date, workSchedule?: WorkSchedule, holidays?: any[]): boolean {
  // Weekends are non-working days
  if (isWeekend(date)) return true;
  
  // Holidays are non-working days
  if (isHolidayDate(date, holidays)) return true;
  
  // RDOs are non-working days
  if (workSchedule && isRDODay(date, workSchedule)) return true;
  
  return false;
}

/**
 * Get schedule information for a specific day
 */
export function getDayScheduleInfo(date: Date, workSchedule: WorkSchedule): any {
  const weekday = getWeekDay(date);
  const fortnightWeek = getFortnightWeek(date);
  
  // Check if this is an RDO
  const isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekday);
  
  // Get the day configuration
  const dayConfig = workSchedule.weeks[fortnightWeek][weekday];
  
  return {
    isRDO,
    isWorkingDay: !!dayConfig && !isRDO,
    hours: dayConfig
  };
}

/**
 * Calculate day hours with break adjustments
 * 
 * @param startTime Start time string in format "HH:MM"
 * @param endTime End time string in format "HH:MM"
 * @param breaks Configuration for breaks (lunch, smoko)
 * @returns number Total hours for the day with breaks subtracted
 */
export function calculateDayHoursWithBreaks(
  startTime: string,
  endTime: string,
  breaks: { lunch?: boolean; smoko?: boolean } = { lunch: true, smoko: true }
): number {
  try {
    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Calculate minutes
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate break minutes
    const lunchMinutes = breaks.lunch ? 30 : 0;
    const smokoMinutes = breaks.smoko ? 15 : 0;
    
    // Calculate total minutes
    const totalMinutes = endMinutes - startMinutes - lunchMinutes - smokoMinutes;
    
    // Convert to hours
    const hours = totalMinutes / 60;
    
    // Return rounded to 2 decimal places
    return Math.round(hours * 100) / 100;
  } catch (error) {
    console.error('Error calculating day hours:', error);
    return 0;
  }
}

/**
 * Calculate day hours without considering breaks
 */
export function calculateDayHours(startTime: string, endTime: string): number {
  try {
    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Calculate minutes
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Convert to hours
    const hours = (endMinutes - startMinutes) / 60;
    
    // Return rounded to 2 decimal places
    return Math.round(hours * 100) / 100;
  } catch (error) {
    console.error('Error calculating day hours:', error);
    return 0;
  }
}

/**
 * Calculate fortnight hours from a schedule
 * Takes RDO days into account
 */
export function calculateFortnightHoursFromSchedule(workSchedule: WorkSchedule): number {
  // Use cache if available
  const cacheKey = `fortnight-hours-${workSchedule.id}`;
  if (scheduleCache.has(cacheKey)) {
    return scheduleCache.get(cacheKey);
  }
  
  let totalHours = 0;
  
  // For both weeks in the fortnight
  for (const weekNum of [1, 2] as const) {
    const weekConfig = workSchedule.weeks[weekNum];
    const rdoDays = workSchedule.rdoDays[weekNum];
    
    // For each day in the week
    for (const [day, dayConfig] of Object.entries(weekConfig)) {
      // Skip if this is an RDO day
      if (rdoDays.includes(day)) continue;
      
      // Skip if no start/end time
      if (!dayConfig || !dayConfig.startTime || !dayConfig.endTime) continue;
      
      // Calculate hours for this day
      const dayHours = calculateDayHoursWithBreaks(
        dayConfig.startTime, 
        dayConfig.endTime, 
        dayConfig.breaks
      );
      
      totalHours += dayHours;
    }
  }
  
  // Cache the result
  scheduleCache.set(cacheKey, totalHours);
  logger.debug(`Calculated fortnight hours for ${workSchedule.id}: ${totalHours}`);
  
  return totalHours;
}

/**
 * Count work days in a month 
 */
export function getWorkdaysInMonth(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  
  let workdays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    // Count it as a workday if it's not a weekend
    if (!isWeekend(currentDate)) {
      workdays++;
    }
  }
  
  return workdays;
}
