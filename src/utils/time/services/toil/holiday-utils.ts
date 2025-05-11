
import { format } from 'date-fns';
import { createTimeLogger } from '../../errors/timeLogger';

const logger = createTimeLogger('HolidayUtils');

/**
 * Check if a given date is a holiday
 * 
 * @param date The date to check
 * @param holidays Optional array of holiday objects
 * @returns boolean True if the date is a holiday
 */
export function isHoliday(date: Date, holidays: any[] = []): boolean {
  try {
    // Check if it's in the provided holidays array
    if (holidays && holidays.length > 0) {
      const dateString = format(date, 'yyyy-MM-dd');
      
      const isMatch = holidays.some(holiday => {
        // Handle different holiday object formats
        if (typeof holiday === 'string') {
          return holiday === dateString;
        }
        
        if (holiday.date) {
          const holidayDate = typeof holiday.date === 'string' 
            ? holiday.date 
            : format(holiday.date, 'yyyy-MM-dd');
          
          return holidayDate === dateString;
        }
        
        return false;
      });
      
      if (isMatch) {
        logger.debug(`Date ${dateString} is a holiday`);
        return true;
      }
    }
    
    // Additional holiday detection logic could be added here
    return false;
  } catch (error) {
    logger.error(`Error checking if date is holiday: ${error}`);
    return false;
  }
}

/**
 * Get all holidays for a given year
 * This is a placeholder - in a real app, this would fetch from an API or config
 */
export function getHolidaysForYear(year: number): Date[] {
  // Placeholder holidays data
  return [
    new Date(`${year}-01-01`),  // New Year's Day
    new Date(`${year}-12-25`),  // Christmas
    new Date(`${year}-12-26`)   // Boxing Day
  ];
}
