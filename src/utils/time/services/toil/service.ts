
import { TOILRecord, TOILSummary, TOILUsage, TOIL_JOB_NUMBER } from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { format } from 'date-fns';
import { v4 as uuidv4 } from "uuid";
import { isValidTOILHours, getSanitizedTOILHours, getTOILHoursValidationMessage } from "@/utils/time/validation/toilValidation";
import { PendingTOILCalculation } from './types';
import { clearHolidayCache } from './holiday-utils';
import { getTOILSummary, storeTOILUsage, clearAllTOILCaches, loadTOILRecords } from './storage';
import { performSingleCalculation, hasRecentlyProcessed, clearProcessedDatesCache } from './batch-processing';
import { createTimeLogger } from '@/utils/time/errors';
import { Holiday } from '@/lib/holidays';

const logger = createTimeLogger('TOILService');

/**
 * Service to manage Time Off In Lieu (TOIL) records
 */
export class TOILService {
  // Batch processing
  private pendingCalculations: Map<string, PendingTOILCalculation> = new Map();
  private calculationTimer: number | null = null;
  private isProcessing = false;
  
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
        // Guard checks for invalid data
        if (!userId) {
          logger.debug('No user ID provided, cannot calculate TOIL');
          resolve(null);
          return;
        }
        
        if (!workSchedule) {
          logger.debug('No work schedule provided, cannot calculate TOIL');
          resolve(null);
          return;
        }
        
        // Guard against empty entries - return zero summary
        if (!entries || entries.length === 0) {
          logger.debug('No entries provided, returning zero summary');
          const monthYear = format(date, 'yyyy-MM');
          resolve({
            userId,
            monthYear,
            accrued: 0,
            used: 0,
            remaining: 0
          });
          return;
        }
  
        // Check if we've recently processed this exact data
        if (hasRecentlyProcessed(userId, date)) {
          // Return cached summary
          const monthYear = format(date, 'yyyy-MM');
          const cachedSummary = getTOILSummary(userId, monthYear);
          resolve(cachedSummary);
          return;
        }
  
        // Queue this calculation request
        const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
        this.pendingCalculations.set(dateKey, {
          userId,
          date,
          entries: [...entries], 
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
   * Record TOIL usage from a timesheet entry
   */
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      if (!entry || entry.jobNumber !== TOIL_JOB_NUMBER) {
        logger.debug(`[TOILService] Entry ${entry?.id} not a TOIL usage (job number: ${entry?.jobNumber})`);
        return false;
      }
      
      // Validation for TOIL usage hours
      if (!isValidTOILHours(entry.hours)) {
        logger.error('[TOILService] Refusing TOIL usage entry with invalid hours:', entry.hours, getTOILHoursValidationMessage(entry.hours));
        return false;
      }
      
      logger.debug(`[TOILService] Recording TOIL usage: ${entry.hours}h for user ${entry.userId} on ${format(entry.date instanceof Date ? entry.date : new Date(entry.date), 'yyyy-MM-dd')}`);
      
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      
      // Create TOIL usage record
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entryDate,
        hours: getSanitizedTOILHours(entry.hours),
        entryId: entry.id,
        monthYear: format(entryDate, 'yyyy-MM')
      };
      
      const result = await storeTOILUsage(usage);
      logger.debug(`[TOILService] TOIL usage ${result ? 'successfully' : 'failed to be'} recorded: ${usage.hours}h`);
      
      return result;
    } catch (error) {
      logger.error('Error recording TOIL usage:', error);
      return false;
    }
  }

  /**
   * Get TOIL summaries for all months for a user
   */
  public getAllTOILSummaries(userId: string): TOILSummary[] {
    try {
      const records = loadTOILRecords();
      
      // Filter records for this user
      const userRecords = records.filter(record => record.userId === userId);
      
      // Get unique months
      const months = new Set<string>();
      userRecords.forEach(record => months.add(record.monthYear));
      
      // Calculate summary for each month
      return Array.from(months).map(month => getTOILSummary(userId, month));
    } catch (error) {
      logger.error('Error getting all TOIL summaries:', error);
      return [];
    }
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
    }, 100);
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
          const result = await performSingleCalculation(entries, date, userId, workSchedule, holidays);
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
   * Clear all TOIL cache
   */
  public clearCache(): void {
    clearProcessedDatesCache();
    clearAllTOILCaches();
    clearHolidayCache();
    logger.debug('All TOIL caches cleared');
  }
}

// Export singleton instance
export const toilService = new TOILService();

// Export constants
export { TOIL_JOB_NUMBER };
