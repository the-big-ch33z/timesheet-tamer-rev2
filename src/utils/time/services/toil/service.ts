
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary, TOILUsage } from "@/types/toil";
import { createTimeLogger } from '@/utils/time/errors';
import { performSingleCalculation, hasRecentlyProcessed } from './batch-processing';
import { PendingTOILCalculation } from './types';
import { getTOILSummary, storeTOILUsage } from './storage';
import { clearHolidayCache } from './holiday-utils';
import { clearAllTOILCaches } from './storage';
import { triggerTOILSave, dispatchTOILUpdate } from './events';

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
   * Calculate and store TOIL accrual based on timesheet entries
   */
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule?: WorkSchedule,
    holidays: Holiday[] = []
  ) {
    return new Promise<TOILSummary | null>((resolve) => {
      if (!userId || !workSchedule || !entries?.length) {
        const monthYear = date.toISOString().slice(0, 7);
        resolve(getTOILSummary(userId, monthYear));
        return;
      }

      // Queue calculation request
      const dateKey = `${userId}-${date.toISOString().slice(0, 10)}`;
      if (hasRecentlyProcessed(userId, date)) {
        const monthYear = date.toISOString().slice(0, 7);
        resolve(getTOILSummary(userId, monthYear));
        return;
      }

      this.pendingCalculations.set(dateKey, {
        userId,
        date,
        entries: [...entries],
        workSchedule,
        holidays,
        resolve
      });

      this.scheduleBatchProcessing();
    });
  }

  /**
   * Record TOIL usage from a timesheet entry
   */
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    if (!entry || !entry.id || !entry.userId) {
      logger.error('Invalid entry for TOIL usage');
      return false;
    }

    try {
      // Create a TOIL usage record from the entry
      const usage: TOILUsage = {
        id: entry.id,
        userId: entry.userId,
        date: entry.date,
        hours: entry.hours,
        entryId: entry.id,
        monthYear: entry.date.toISOString().slice(0, 7)
      };
      
      // Store the usage record
      const result = await storeTOILUsage(usage);
      
      if (result) {
        logger.debug(`Recorded TOIL usage: ${entry.hours} hours (id=${entry.id})`);
        // Trigger an update event
        triggerTOILSave();
      }
      
      return result;
    } catch (error) {
      logger.error('Error recording TOIL usage:', error);
      return false;
    }
  }

  private scheduleBatchProcessing() {
    if (this.calculationTimer !== null || this.isProcessing) return;
    
    this.calculationTimer = window.setTimeout(() => {
      this.processPendingCalculations();
    }, 100);
  }

  private async processPendingCalculations() {
    if (this.isProcessing || this.pendingCalculations.size === 0) {
      this.calculationTimer = null;
      return;
    }

    try {
      this.isProcessing = true;
      const calculations = Array.from(this.pendingCalculations.values());
      this.pendingCalculations.clear();
      this.calculationTimer = null;

      for (const calc of calculations) {
        try {
          const result = await performSingleCalculation(
            calc.entries,
            calc.date,
            calc.userId,
            calc.workSchedule,
            calc.holidays
          );

          if (result) {
            dispatchTOILUpdate(result);
          }

          calc.resolve(result);
        } catch (error) {
          logger.error('Error in TOIL calculation:', error);
          calc.resolve(null);
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.pendingCalculations.size > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  public clearCache(): void {
    clearHolidayCache();
    clearAllTOILCaches();
    logger.debug('All TOIL caches cleared');
  }
}

// Export singleton instance
export const toilService = new TOILService();
