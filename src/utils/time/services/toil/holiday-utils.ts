
import { Holiday } from "@/lib/holidays";
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILHolidayUtils');

// Cache for holidays to avoid redundant date comparisons
const holidayCache = new Map<string, boolean>();

/**
 * Efficiently check if a date is a holiday
 */
export function isDateHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  if (holidayCache.has(dateKey)) {
    return holidayCache.get(dateKey) || false;
  }
  
  // Check if it's a holiday
  const isHoliday = holidays.some(holiday => holiday.date === dateKey);
  
  // Cache result
  holidayCache.set(dateKey, isHoliday);
  
  return isHoliday;
}

/**
 * Clear holiday cache - should be called when month changes
 */
export function clearHolidayCache(): void {
  holidayCache.clear();
  logger.debug('Holiday cache cleared');
}
