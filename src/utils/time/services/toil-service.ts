import { v4 as uuidv4 } from "uuid";
import { TOILRecord, TOILSummary, TOILUsage, TOIL_JOB_NUMBER } from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from '@/utils/time/errors';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateHoursFromTimes } from '../calculations';
import { storageWriteLock } from './storage-operations';
import { getFortnightWeek, getWeekDay, calculateDayHours } from '../scheduleUtils';
import { isValidTOILHours, getSanitizedTOILHours, getTOILHoursValidationMessage } from '../validation/toilValidation';
import { isNonWorkingDay } from '../scheduleUtils';
import { Holiday } from '@/lib/holidays';

const logger = createTimeLogger('TOILService');

// Local storage keys
const TOIL_RECORDS_KEY = 'toilRecords';
const TOIL_USAGE_KEY = 'toilUsage';

// Cache for holidays to avoid redundant date comparisons
const holidayCache = new Map<string, boolean>();

/**
 * Efficiently check if a date is a holiday
 */
function isDateHoliday(date: Date, holidays: Holiday[]): boolean {
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

// Batching mechanism for TOIL calculations
type PendingTOILCalculation = {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
};

/**
 * Service to manage Time Off In Lieu (TOIL) records
 */
export class TOILService {
  // Cache to prevent duplicate TOIL records for the same day
  private processedDates: Map<string, number> = new Map();
  private pendingCalculations: Map<string, PendingTOILCalculation> = new Map();
  private calculationTimer: number | null = null;
  private isProcessing = false;
  
  // Cache for results to prevent redundant storage operations
  private summaryCache: Map<string, TOILSummary> = new Map();
  
  /**
   * Calculate and store TOIL accrual based on timesheet entries compared to schedule
   */
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule?: WorkSchedule,
    holidays: Holiday[] = []
  ): Promise<TOILSummary | null> {
    return new Promise<TOILSummary | null>((resolve) => {
      try {
        if (!workSchedule) {
          logger.debug('No work schedule provided, cannot calculate TOIL');
          resolve(null);
          return;
        }
  
        // Generate a unique key for this calculation request
        const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
        
        // Check if we've recently processed this exact data
        const now = Date.now();
        if (this.processedDates.has(dateKey) && now - this.processedDates.get(dateKey)! < 300) {
          logger.debug(`Recently processed TOIL for ${dateKey}, using cached result`);
          
          // Return cached summary
          const monthYear = format(date, 'yyyy-MM');
          const cachedSummary = this.getTOILSummary(userId, monthYear);
          resolve(cachedSummary);
          return;
        }
  
        // Queue this calculation request
        this.pendingCalculations.set(dateKey, {
          userId,
          date,
          entries: [...entries], // Clone the entries array to avoid mutation issues
          workSchedule,
          holidays,
          resolve
        });
        
        // Schedule processing if not already scheduled
        this.scheduleBatchProcessing();
      } catch (error) {
        logger.error('Error scheduling TOIL calculation:', error);
        resolve(null);
      }
    });
  }
  
  /**
   * Schedule batch processing of pending calculations
   */
  private scheduleBatchProcessing() {
    // Skip if already scheduled or processing
    if (this.calculationTimer !== null || this.isProcessing) {
      return;
    }
    
    // Schedule for next frame to not block UI
    this.calculationTimer = window.setTimeout(() => {
      this.processPendingCalculations();
    }, 100); // Small delay to allow batching of multiple requests
  }
  
  /**
   * Process all pending TOIL calculations in batch
   */
  private async processPendingCalculations() {
    if (this.isProcessing || this.pendingCalculations.size === 0) {
      this.calculationTimer = null;
      return;
    }
    
    try {
      this.isProcessing = true;
      
      // Take a snapshot of current pending calculations
      const calculations = Array.from(this.pendingCalculations.values());
      
      // Clear pending queue
      this.pendingCalculations.clear();
      this.calculationTimer = null;
      
      logger.debug(`[TOILService] Processing batch of ${calculations.length} TOIL calculations`);
      
      // Process each calculation
      for (const calc of calculations) {
        const { userId, date, entries, workSchedule, holidays, resolve } = calc;
        
        try {
          const result = await this.performSingleCalculation(entries, date, userId, workSchedule, holidays);
          resolve(result);
        } catch (error) {
          logger.error('Error in TOIL calculation:', error);
          resolve(null);
        }
      }
    } finally {
      this.isProcessing = false;
      
      // Check if new calculations were added during processing
      if (this.pendingCalculations.size > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }
  
  /**
   * Perform a single TOIL calculation
   */
  private async performSingleCalculation(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule?: WorkSchedule,
    holidays: Holiday[] = []
  ): Promise<TOILSummary | null> {
    try {
      // Guard against empty entries
      if (!entries || entries.length === 0) {
        logger.debug('[TOILService] No entries found, skipping TOIL calculation');
        return {
          userId,
          monthYear: format(date, 'yyyy-MM'),
          accrued: 0,
          used: 0,
          remaining: 0
        };
      }

      const monthYear = format(date, 'yyyy-MM');
      
      // Filter out TOIL usage entries before calculating actual hours
      const nonToilEntries = entries.filter(entry => entry.jobNumber !== TOIL_JOB_NUMBER);
      
      // Guard against no valid entries
      if (nonToilEntries.length === 0) {
        logger.debug('[TOILService] No non-TOIL entries found');
        return {
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        };
      }

      const actualHours = nonToilEntries.reduce((sum, entry) => {
        // Validate hours before adding
        const hours = isFinite(entry.hours) ? entry.hours : 0;
        return hours > 0 ? sum + hours : sum;
      }, 0);

      let toilHours = 0;
      
      // Only calculate TOIL if we have actual hours
      if (actualHours > 0) {
        // If it's a non-working day, all hours count as TOIL
        if (isNonWorkingDay(date, workSchedule, holidays)) {
          toilHours = actualHours;
          logger.debug(`[TOIL Calc] Non-working day detected, all ${actualHours}h count as TOIL`);
        } else {
          // For working days, calculate excess hours as before
          const weekDay = getWeekDay(date);
          const weekNum = getFortnightWeek(date);
          const daySchedule = workSchedule?.weeks[weekNum][weekDay];
          
          if (daySchedule?.startTime && daySchedule?.endTime) {
            const scheduledHours = calculateDayHours(
              daySchedule.startTime,
              daySchedule.endTime,
              daySchedule.breaks
            );
            toilHours = Math.max(0, actualHours - scheduledHours);
            logger.debug(`[TOIL Calc] Working day: actual=${actualHours}h, scheduled=${scheduledHours}h, TOIL=${toilHours}h`);
          }
        }
      }

      // ENFORCE positive, valid, clamped TOIL hours
      if (!isValidTOILHours(toilHours)) {
        logger.error('[TOILService] Invalid TOIL hours attempted to be stored:', toilHours);
        toilHours = 0;
      } else {
        toilHours = getSanitizedTOILHours(toilHours);
      }

      logger.debug(`[TOIL Calc] Final TOIL hours to store: ${toilHours}`);

      if (toilHours > 0) {
        const record: TOILRecord = {
          id: uuidv4(),
          userId,
          date,
          hours: toilHours,
          monthYear,
          entryId: nonToilEntries.length > 0 ? nonToilEntries[0].id : undefined,
          status: 'active'
        };
        await this.storeTOILRecord(record);
        logger.debug(`[TOIL Calc] Created new TOIL record: ${toilHours}h (id=${record.id})`);
      }

      const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
      this.processedDates.set(dateKey, Date.now());

      // Cleanup old entries from processedDates when it gets too large
      if (this.processedDates.size > 100) {
        const keysToDelete = Array.from(this.processedDates.keys())
          .sort((a, b) => (this.processedDates.get(a) || 0) - (this.processedDates.get(b) || 0))
          .slice(0, 50);
        
        keysToDelete.forEach(key => this.processedDates.delete(key));
      }

      // Return updated summary
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
        logger.debug(`[TOILService] Entry ${entry.id} not a TOIL usage (job number: ${entry.jobNumber})`);
        return false;
      }
      
      // Validation for TOIL usage hours
      if (!isValidTOILHours(entry.hours)) {
        logger.error('[TOILService] Refusing TOIL usage entry with invalid hours:', entry.hours, getTOILHoursValidationMessage(entry.hours));
        return false;
      }
      
      logger.debug(`[TOILService] Recording TOIL usage: ${entry.hours}h for user ${entry.userId} on ${format(entry.date, 'yyyy-MM-dd')}`);
      
      // Check if this entry has already been recorded as TOIL usage
      const existingUsage = this.loadTOILUsage().find(usage => usage.entryId === entry.id);
      if (existingUsage) {
        logger.debug(`[TOILService] TOIL usage already recorded for entry ${entry.id}, updating`);
        existingUsage.hours = getSanitizedTOILHours(entry.hours);
        await this.updateTOILUsage(existingUsage);
        return true;
      }
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date instanceof Date ? entry.date : new Date(entry.date),
        hours: getSanitizedTOILHours(entry.hours),
        entryId: entry.id,
        monthYear: format(entry.date instanceof Date ? entry.date : new Date(entry.date), 'yyyy-MM')
      };
      
      const result = await this.storeTOILUsage(usage);
      logger.debug(`[TOILService] TOIL usage ${result ? 'successfully' : 'failed to be'} recorded: ${usage.hours}h`);
      
      // Clear summary cache when usage changes
      this.summaryCache.clear();
      
      return result;
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
   * Update existing TOIL usage
   */
  private async updateTOILUsage(usage: TOILUsage): Promise<boolean> {
    try {
      // Acquire lock
      await storageWriteLock.acquire();
      
      try {
        // Get existing usage records
        const usageRecords = this.loadTOILUsage();
        
        // Find and update the usage record
        const index = usageRecords.findIndex(r => r.id === usage.id);
        if (index >= 0) {
          usageRecords[index] = usage;
          
          // Save usage records
          localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usageRecords));
          
          logger.debug(`Updated TOIL usage: ${usage.id}, ${usage.hours} hours`);
          return true;
        }
        
        return false;
      } finally {
        // Release lock
        storageWriteLock.release();
      }
    } catch (error) {
      logger.error('Error updating TOIL usage:', error);
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
      // Check cache first
      const cacheKey = `${userId}-${monthYear}`;
      if (this.summaryCache.has(cacheKey)) {
        return { ...this.summaryCache.get(cacheKey)! };
      }
      
      const records = this.loadTOILRecords();
      const usage = this.loadTOILUsage();
      
      logger.debug(`[TOILService] Getting summary for user=${userId}, month=${monthYear}, records=${records.length}, usage=${usage.length}`);
      
      // Filter records for this user and month - optimize by doing a single pass
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
      
      logger.debug(`[TOILService] Summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
      
      const summary = {
        userId,
        monthYear,
        accrued,
        used,
        remaining
      };
      
      // Cache the result
      this.summaryCache.set(cacheKey, summary);
      
      return summary;
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
    this.summaryCache.clear();
    holidayCache.clear();
    logger.debug('TOIL cache cleared');
  }
}

// Export singleton instance
export const toilService = new TOILService();

// Export constants
export { TOIL_JOB_NUMBER };
