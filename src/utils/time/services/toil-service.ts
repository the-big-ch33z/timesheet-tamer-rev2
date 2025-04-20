import { v4 as uuidv4 } from "uuid";
import { TOILRecord, TOILSummary, TOILUsage, TOIL_JOB_NUMBER } from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from '@/utils/time/errors';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateHoursFromTimes } from '../calculations';
import { storageWriteLock } from './storage-operations';
import { getFortnightWeek, calculateDayHours } from '../scheduleUtils';

const logger = createTimeLogger('TOILService');

// Local storage keys
const TOIL_RECORDS_KEY = 'toilRecords';
const TOIL_USAGE_KEY = 'toilUsage';

/**
 * Service to manage Time Off In Lieu (TOIL) records
 */
export class TOILService {
  /**
   * Calculate and store TOIL accrual based on timesheet entries compared to schedule
   */
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule?: WorkSchedule
  ): Promise<TOILSummary | null> {
    try {
      if (!workSchedule) {
        logger.debug('No work schedule provided, cannot calculate TOIL');
        return null;
      }

      const monthYear = format(date, 'yyyy-MM');
      
      // Get the correct week number (1 or 2) from the schedule
      const weekNum = getFortnightWeek(date);
      const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof typeof workSchedule.weeks[1];
      
      // Get scheduled hours for this day
      const daySchedule = workSchedule.weeks[weekNum][dayOfWeek];
      
      if (!daySchedule?.startTime || !daySchedule?.endTime) {
        logger.debug(`No schedule found for ${format(date, 'yyyy-MM-dd')}`);
        return null;
      }

      // Calculate scheduled hours including break deductions
      const scheduledHours = calculateDayHours(
        daySchedule.startTime,
        daySchedule.endTime,
        daySchedule.breaks
      );
      
      logger.debug(`Scheduled hours for ${format(date, 'yyyy-MM-dd')}: ${scheduledHours}`);
      
      // Calculate total hours worked from timesheet entries
      const actualHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      logger.debug(`Actual hours worked: ${actualHours}`);
      
      // Calculate excess hours (TOIL to accrue)
      const excessHours = Math.max(0, actualHours - scheduledHours);
      logger.debug(`Excess hours (TOIL): ${excessHours}`);
      
      if (excessHours > 0) {
        // Create TOIL record
        const record: TOILRecord = {
          id: uuidv4(),
          userId,
          date,
          hours: excessHours,
          monthYear,
          entryId: entries.length > 0 ? entries[0].id : undefined,
          status: 'active'
        };
        
        // Store TOIL record
        await this.storeTOILRecord(record);
        logger.debug(`Stored TOIL record: ${excessHours} hours`);
      }
      
      // Return summary for the month
      return this.getTOILSummary(userId, monthYear);
    } catch (error) {
      logger.error('Error calculating TOIL:', error);
      return null;
    }
  }

  /**
   * Get scheduled hours for a day based on work schedule
   */
  private getScheduledHoursForDay(date: Date, workSchedule: WorkSchedule): number {
    try {
      const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof typeof workSchedule.weeks[1];
      const weekNumber = 1; // Default to week 1 for now
      
      const daySchedule = workSchedule.weeks[weekNumber]?.[dayOfWeek];
      
      if (!daySchedule) {
        return 0; // No schedule for this day
      }
      
      // Calculate hours from start and end time
      const { startTime, endTime, breaks } = daySchedule;
      
      if (!startTime || !endTime) {
        return 0;
      }
      
      let scheduledHours = calculateHoursFromTimes(startTime, endTime);
      
      // Subtract unpaid breaks (lunch = 30 min)
      if (breaks?.lunch) {
        scheduledHours -= 0.5; // 30 minutes for lunch
      }
      
      return scheduledHours;
    } catch (error) {
      logger.error('Error calculating scheduled hours:', error);
      return 0;
    }
  }

  /**
   * Record TOIL usage from a timesheet entry
   */
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      if (entry.jobNumber !== TOIL_JOB_NUMBER) {
        return false;
      }
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date,
        hours: entry.hours,
        entryId: entry.id,
        monthYear: format(entry.date, 'yyyy-MM')
      };
      
      await this.storeTOILUsage(usage);
      return true;
    } catch (error) {
      logger.error('Error recording TOIL usage:', error);
      return false;
    }
  }

  /**
   * Store a TOIL record
   */
  private async storeTOILRecord(record: TOILRecord): Promise<boolean> {
    try {
      // Acquire lock
      await storageWriteLock.acquire();
      
      try {
        // Get existing records
        const records = this.loadTOILRecords();
        
        // Add new record
        records.push(record);
        
        // Save records
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
        
        logger.debug(`Stored TOIL record: ${record.id}, ${record.hours} hours`);
        return true;
      } finally {
        // Release lock
        storageWriteLock.release();
      }
    } catch (error) {
      logger.error('Error storing TOIL record:', error);
      return false;
    }
  }

  /**
   * Store TOIL usage
   */
  private async storeTOILUsage(usage: TOILUsage): Promise<boolean> {
    try {
      // Acquire lock
      await storageWriteLock.acquire();
      
      try {
        // Get existing usage records
        const usageRecords = this.loadTOILUsage();
        
        // Add new usage record
        usageRecords.push(usage);
        
        // Save usage records
        localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usageRecords));
        
        logger.debug(`Stored TOIL usage: ${usage.id}, ${usage.hours} hours`);
        return true;
      } finally {
        // Release lock
        storageWriteLock.release();
      }
    } catch (error) {
      logger.error('Error storing TOIL usage:', error);
      return false;
    }
  }

  /**
   * Load TOIL records from storage
   */
  private loadTOILRecords(): TOILRecord[] {
    try {
      const storedRecords = localStorage.getItem(TOIL_RECORDS_KEY);
      
      if (!storedRecords) {
        return [];
      }
      
      const records: TOILRecord[] = JSON.parse(storedRecords).map((record: any) => ({
        ...record,
        date: new Date(record.date)
      }));
      
      return records;
    } catch (error) {
      logger.error('Error loading TOIL records:', error);
      return [];
    }
  }

  /**
   * Load TOIL usage records from storage
   */
  private loadTOILUsage(): TOILUsage[] {
    try {
      const storedUsage = localStorage.getItem(TOIL_USAGE_KEY);
      
      if (!storedUsage) {
        return [];
      }
      
      const usage: TOILUsage[] = JSON.parse(storedUsage).map((usage: any) => ({
        ...usage,
        date: new Date(usage.date)
      }));
      
      return usage;
    } catch (error) {
      logger.error('Error loading TOIL usage:', error);
      return [];
    }
  }

  /**
   * Get TOIL summary for a user and month
   */
  public getTOILSummary(userId: string, monthYear: string): TOILSummary {
    try {
      const records = this.loadTOILRecords();
      const usage = this.loadTOILUsage();
      
      // Filter records for this user and month
      const userRecords = records.filter(
        record => record.userId === userId && record.monthYear === monthYear
      );
      
      // Filter usage for this user and month
      const userUsage = usage.filter(
        usage => usage.userId === userId && usage.monthYear === monthYear
      );
      
      // Calculate accrued hours
      const accrued = userRecords.reduce((sum, record) => sum + record.hours, 0);
      
      // Calculate used hours
      const used = userUsage.reduce((sum, usage) => sum + usage.hours, 0);
      
      // Calculate remaining hours
      const remaining = Math.max(0, accrued - used);
      
      return {
        userId,
        monthYear,
        accrued,
        used,
        remaining
      };
    } catch (error) {
      logger.error('Error getting TOIL summary:', error);
      return {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
  }

  /**
   * Get TOIL summaries for all months for a user
   */
  public getAllTOILSummaries(userId: string): TOILSummary[] {
    try {
      const records = this.loadTOILRecords();
      const usage = this.loadTOILUsage();
      
      // Filter records for this user
      const userRecords = records.filter(record => record.userId === userId);
      
      // Filter usage for this user
      const userUsage = usage.filter(usage => usage.userId === userId);
      
      // Get unique months
      const months = new Set<string>();
      userRecords.forEach(record => months.add(record.monthYear));
      userUsage.forEach(usage => months.add(usage.monthYear));
      
      // Calculate summary for each month
      return Array.from(months).map(month => this.getTOILSummary(userId, month));
    } catch (error) {
      logger.error('Error getting all TOIL summaries:', error);
      return [];
    }
  }
}

// Export singleton instance
export const toilService = new TOILService();

// Export constants
export { TOIL_JOB_NUMBER };
