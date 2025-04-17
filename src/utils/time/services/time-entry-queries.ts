
import { TimeEntry } from "@/types";
import { EntryCache, TimeEntryServiceConfig } from "./types";
import { createTimeLogger } from '../errors/timeLogger';
import { isValidDate } from '../validation/dateValidation';
import { 
  getCachedUserEntries, 
  getCachedDayEntries, 
  getCachedMonthEntries 
} from "./cache-management";

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
    
    return getCachedUserEntries(this.cache, userId, allEntries);
  }

  /**
   * Get entries for a specific day and user
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
    
    return getCachedDayEntries(this.cache, date, userId, userEntries);
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
    
    return getCachedMonthEntries(this.cache, date, userId, userEntries);
  }
}
