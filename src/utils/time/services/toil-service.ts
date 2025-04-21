import { v4 as uuidv4 } from "uuid";
import { TOILRecord, TOILSummary, TOILUsage, TOIL_JOB_NUMBER } from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from '@/utils/time/errors';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateHoursFromTimes } from '../calculations';
import { storageWriteLock } from './storage-operations';
import { getFortnightWeek, getWeekDay, calculateDayHours } from '../scheduleUtils';
import { isValidTOILHours, getSanitizedTOILHours, getTOILHoursValidationMessage } from '../validation/toilValidation';

const logger = createTimeLogger('TOILService');

// Local storage keys
const TOIL_RECORDS_KEY = 'toilRecords';
const TOIL_USAGE_KEY = 'toilUsage';

/**
 * Service to manage Time Off In Lieu (TOIL) records
 */
export class TOILService {
  // Cache to prevent duplicate TOIL records for the same day
  private processedDates: Map<string, boolean> = new Map();
  
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

      const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
      if (this.processedDates.has(dateKey)) {
        logger.debug(`Already processed TOIL for ${dateKey}, skipping`);
        const monthYear = format(date, 'yyyy-MM');
        return this.getTOILSummary(userId, monthYear);
      }

      const monthYear = format(date, 'yyyy-MM');
      const weekNum = getFortnightWeek(date);
      const dayOfWeek = getWeekDay(date);

      logger.debug(`TOIL Calculation: userId=${userId} date=${format(date, 'yyyy-MM-dd')} week=${weekNum} day=${dayOfWeek}`);

      const daySchedule = workSchedule.weeks[weekNum][dayOfWeek];

      if (!daySchedule?.startTime || !daySchedule?.endTime) {
        logger.debug(`[TOIL Calc] No schedule found for ${format(date, 'yyyy-MM-dd')}`);
        return null;
      }

      // Calculate scheduled and worked hours
      const scheduledHours = calculateDayHours(
        daySchedule.startTime,
        daySchedule.endTime,
        daySchedule.breaks
      );
      const actualHours = entries.reduce((sum, entry) => sum + (isFinite(entry.hours) ? entry.hours : 0), 0);

      logger.debug(`[TOIL Calc] scheduledHours=${scheduledHours}, actualHours=${actualHours}`);

      let excessHours = Math.max(0, actualHours - scheduledHours);

      // ENFORCE positive, valid, clamped TOIL hours
      if (!isValidTOILHours(excessHours)) {
        logger.error('[TOILService] Invalid TOIL hours attempted to be stored:', excessHours, getTOILHoursValidationMessage(excessHours));
        excessHours = 0;
      } else {
        excessHours = getSanitizedTOILHours(excessHours);
      }

      logger.debug(`[TOIL Calc] Final excess hours to store (validated): ${excessHours}`);

      // Look for previous TOIL record for this date
      const existingRecords = this.loadTOILRecords().filter(
        record => record.userId === userId && 
                 format(record.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      // Guarantee CLAMP and VALIDATION before any update/create logic
      if (existingRecords.length > 0) {
        logger.debug(`[TOIL Calc] Found existing record: updating or removing if needed (id=${existingRecords[0].id})`);
        if (excessHours > 0) {
          const existingRecord = existingRecords[0];
          if (!isValidTOILHours(excessHours)) {
            logger.error("[TOILService] - Attempted to update record with invalid TOIL hours. Skipped.", excessHours);
          } else {
            existingRecord.hours = getSanitizedTOILHours(excessHours);
            await this.updateTOILRecord(existingRecord);
            logger.debug(`[TOIL Calc] Updated TOIL record hours to ${existingRecord.hours}`);
          }
        } else {
          await this.removeTOILRecord(existingRecords[0].id);
          logger.debug('[TOIL Calc] Removed TOIL record as excessHours==0');
        }
      } else if (excessHours > 0) {
        if (!isValidTOILHours(excessHours)) {
          logger.error('[TOILService] Refusing to store new invalid TOIL record:', excessHours, getTOILHoursValidationMessage(excessHours));
        } else {
          const record: TOILRecord = {
            id: uuidv4(),
            userId,
            date,
            hours: getSanitizedTOILHours(excessHours),
            monthYear,
            entryId: entries.length > 0 ? entries[0].id : undefined,
            status: 'active'
          };
          await this.storeTOILRecord(record);
          logger.debug(`[TOIL Calc] Created new TOIL record: ${record.hours}h (id=${record.id})`);
        }
      }

      this.processedDates.set(dateKey, true);

      // Roll off memory leaks
      if (this.processedDates.size > 100) {
        const keysToDelete = [...this.processedDates.keys()].slice(0, 50);
        keysToDelete.forEach(key => this.processedDates.delete(key));
      }

      // Direct summary return for accurate UI updates
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
      const dayOfWeek = getWeekDay(date);
      const weekNumber = getFortnightWeek(date);
      
      const daySchedule = workSchedule.weeks[weekNumber]?.[dayOfWeek];
      
      if (!daySchedule) {
        return 0; // No schedule for this day
      }
      
      // Calculate hours from start and end time
      const { startTime, endTime, breaks } = daySchedule;
      
      if (!startTime || !endTime) {
        return 0;
      }
      
      // Use calculateDayHours which handles breaks correctly
      return calculateDayHours(startTime, endTime, breaks);
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
      // Validation for TOIL usage hours
      if (!isValidTOILHours(entry.hours)) {
        logger.error('[TOILService] Refusing TOIL usage entry with invalid hours:', entry.hours, getTOILHoursValidationMessage(entry.hours));
        return false;
      }
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date,
        hours: getSanitizedTOILHours(entry.hours),
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
   * Update an existing TOIL record
   */
  private async updateTOILRecord(record: TOILRecord): Promise<boolean> {
    try {
      // Acquire lock
      await storageWriteLock.acquire();
      
      try {
        // Get existing records
        const records = this.loadTOILRecords();
        
        // Find and update the record
        const index = records.findIndex(r => r.id === record.id);
        if (index >= 0) {
          records[index] = record;
          
          // Save records
          localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
          
          logger.debug(`Updated TOIL record: ${record.id}, ${record.hours} hours`);
          return true;
        }
        
        return false;
      } finally {
        // Release lock
        storageWriteLock.release();
      }
    } catch (error) {
      logger.error('Error updating TOIL record:', error);
      return false;
    }
  }
  
  /**
   * Remove a TOIL record
   */
  private async removeTOILRecord(recordId: string): Promise<boolean> {
    try {
      // Acquire lock
      await storageWriteLock.acquire();
      
      try {
        // Get existing records
        const records = this.loadTOILRecords();
        
        // Filter out the record to remove
        const updatedRecords = records.filter(r => r.id !== recordId);
        
        // Save records
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords));
        
        logger.debug(`Removed TOIL record: ${recordId}`);
        return true;
      } finally {
        // Release lock
        storageWriteLock.release();
      }
    } catch (error) {
      logger.error('Error removing TOIL record:', error);
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
  
  /**
   * Clear all TOIL cache
   */
  public clearCache(): void {
    this.processedDates.clear();
    logger.debug('TOIL cache cleared');
  }
}

// Export singleton instance
export const toilService = new TOILService();

// Export constants
export { TOIL_JOB_NUMBER };
