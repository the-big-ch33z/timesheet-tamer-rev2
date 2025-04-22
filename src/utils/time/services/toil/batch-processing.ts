
import { TimeEntry, WorkSchedule } from "@/types";
import { TOILSummary } from "@/types/toil";
import { PendingTOILCalculation } from './types';
import { format } from 'date-fns';
import { calculateTOILHours, createTOILRecord } from './calculation';
import { storeTOILRecord, getTOILSummary } from './storage';
import { createTimeLogger } from '@/utils/time/errors';
import { Holiday } from "@/lib/holidays";

const logger = createTimeLogger('TOILBatchProcessing');

// Cache to prevent duplicate TOIL records for the same day
const processedDates = new Map<string, number>();

/**
 * Process a single TOIL calculation
 */
export async function performSingleCalculation(
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
    
    // Calculate TOIL hours
    const toilHours = calculateTOILHours(entries, date, workSchedule, holidays);

    logger.debug(`[TOIL Batch] Final TOIL hours to store: ${toilHours}`);

    // Store TOIL record if hours > 0
    if (toilHours > 0) {
      const record = createTOILRecord(
        userId, 
        date, 
        toilHours, 
        entries.length > 0 ? entries[0].id : undefined
      );
      
      await storeTOILRecord(record);
      logger.debug(`[TOIL Batch] Created new TOIL record: ${toilHours}h (id=${record.id})`);
    }

    // Mark as processed
    const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
    processedDates.set(dateKey, Date.now());

    // Cleanup old entries from processedDates when it gets too large
    if (processedDates.size > 100) {
      const keysToDelete = Array.from(processedDates.keys())
        .sort((a, b) => (processedDates.get(a) || 0) - (processedDates.get(b) || 0))
        .slice(0, 50);
      
      keysToDelete.forEach(key => processedDates.delete(key));
    }

    // Return updated summary
    return getTOILSummary(userId, monthYear);
  } catch (error) {
    logger.error('Error in TOIL calculation:', error);
    return null;
  }
}

/**
 * Check if we've recently processed this exact data
 */
export function hasRecentlyProcessed(userId: string, date: Date): boolean {
  const dateKey = `${userId}-${format(date, 'yyyy-MM-dd')}`;
  const now = Date.now();
  
  if (processedDates.has(dateKey) && now - processedDates.get(dateKey)! < 300) {
    logger.debug(`Recently processed TOIL for ${dateKey}, using cached result`);
    return true;
  }
  
  return false;
}

/**
 * Clear processed dates cache
 */
export function clearProcessedDatesCache(): void {
  processedDates.clear();
  logger.debug('Processed dates cache cleared');
}
