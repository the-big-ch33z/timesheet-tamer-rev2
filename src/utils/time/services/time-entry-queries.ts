
import { TimeEntry } from "@/types";
import { EntryCache, TimeEntryServiceConfig } from "./types";
import { createTimeLogger } from '../errors/timeLogger';
import { isValidDate, formatDateForComparison } from '../validation/dateValidation';

const logger = createTimeLogger('TimeEntryQueries');

/**
 * Class for handling time entry query operations
 */
export class TimeEntryQueries {
  private cache: EntryCache;
  private config: Required<TimeEntryServiceConfig>;

  constructor(cache: EntryCache, config: Required<TimeEntryServiceConfig>) {
    this.cache = cache;
    this.config = config;
  }

  /**
   * Get entries for a specific user
   */
  public getUserEntries(userId: string, allEntries: TimeEntry[]): TimeEntry[] {
    if (!userId) {
      logger.warn('No userId provided to getUserEntries');
      return [];
    }
    
    return this.getCachedUserEntries(userId, allEntries);
  }

  /**
   * Get entries for a specific day and user with improved date comparison
   */
  public getDayEntries(date: Date, userId: string, userEntries: TimeEntry[]): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getDayEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getDayEntries');
      return [];
    }
    
    const dateString = formatDateForComparison(date);
    
    return userEntries.filter(entry => {
      const entryDateString = formatDateForComparison(entry.date);
      return entryDateString === dateString;
    });
  }

  /**
   * Get entries for a specific month and user
   */
  public getMonthEntries(date: Date, userId: string, userEntries: TimeEntry[]): TimeEntry[] {
    if (!isValidDate(date)) {
      logger.warn('Invalid date provided to getMonthEntries', date);
      return [];
    }
    
    if (!userId) {
      logger.warn('No userId provided to getMonthEntries');
      return [];
    }
    
    return this.getCachedMonthEntries(date, userId, userEntries);
  }
  
  /**
   * Helper method to get cached entries for a user
   */
  private getCachedUserEntries(userId: string, allEntries: TimeEntry[]): TimeEntry[] {
    if (!userId) {
      return [];
    }
    
    return allEntries.filter(entry => entry.userId === userId);
  }
  
  /**
   * Helper method to get cached entries for a month and user
   */
  private getCachedMonthEntries(date: Date, userId: string, userEntries: TimeEntry[]): TimeEntry[] {
    if (!date || !userId) {
      return [];
    }
    
    const month = date.getMonth();
    const year = date.getFullYear();
    
    return userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
  }
}
