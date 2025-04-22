
import { Holiday } from "@/lib/holidays";
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';

const logger = createTimeLogger('TOILHolidays');

// Holiday cache for quick lookups
const holidayDateCache = new Map<string, boolean>();

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[] = []): boolean {
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
}

/**
 * Clear holiday cache
 */
export function clearHolidayCache(): void {
  holidayDateCache.clear();
  logger.debug('Holiday cache cleared');
}
