
import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';
import { isValidDate } from '../validation/dateValidation';

const logger = createTimeLogger('TimeEntryQueries');

/**
 * Filter entries by user ID
 */
export function filterEntriesByUser(
  allEntries: TimeEntry[],
  userId: string
): TimeEntry[] {
  if (!userId) {
    logger.warn('No userId provided for filtering');
    return [];
  }
  
  return allEntries.filter(entry => entry.userId === userId);
}

/**
 * Filter entries by specific day
 */
export function filterEntriesByDay(
  entries: TimeEntry[],
  date: Date
): TimeEntry[] {
  if (!isValidDate(date)) {
    logger.warn('Invalid date provided for filtering', date);
    return [];
  }
  
  return entries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return entryDate.toDateString() === date.toDateString();
  });
}

/**
 * Filter entries by month
 */
export function filterEntriesByMonth(
  entries: TimeEntry[],
  date: Date
): TimeEntry[] {
  if (!isValidDate(date)) {
    logger.warn('Invalid date provided for filtering', date);
    return [];
  }
  
  return entries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return (
      entryDate.getMonth() === date.getMonth() && 
      entryDate.getFullYear() === date.getFullYear()
    );
  });
}
