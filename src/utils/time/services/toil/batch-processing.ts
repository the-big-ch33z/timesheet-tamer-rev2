
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILRecord, TOILSummary } from "@/types/toil";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from '@/utils/time/errors';
import { format, isSameMonth } from 'date-fns';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { calculateTOILHours } from "./calculation";
import { 
  storeTOILRecord, 
  getTOILSummary, 
  cleanupDuplicateTOILRecords 
} from "./storage/index";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';

// Re-export queue types and functions for backward compatibility
export type { 
  PendingTOILCalculation
} from './queue/TOILQueueManager';

export {
  hasRecentlyProcessed,
  clearRecentProcessing,
  queueTOILCalculation,
  processTOILQueue
} from './queue/TOILQueueManager';

const logger = createTimeLogger('TOILBatchProcessor');

/**
 * Perform a TOIL calculation for a single batch of entries
 * This function remains in this file as it's the core calculation logic
 */
export async function performSingleCalculation(
  entries: TimeEntry[],
  date: Date,
  userId: string,
  workSchedule?: WorkSchedule,
  holidays: Holiday[] = []
): Promise<TOILSummary | null> {
  try {
    if (!workSchedule || !userId) {
      logger.debug('Missing required workSchedule or userId for TOIL calculation');
      return null;
    }

    // First, cleanup any existing duplicate records
    // This runs asynchronously but we don't need to wait for it
    cleanupDuplicateTOILRecords(userId).catch(err => 
      logger.error('Error while cleaning up duplicate records:', err)
    );

    // Filter entries to same month only
    const filteredEntries = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return isSameMonth(entryDate, date);
    });
    
    if (filteredEntries.length === 0) {
      logger.debug(`No valid entries for TOIL calculation on ${date.toISOString().slice(0, 10)}`);
      return getTOILSummary(userId, format(date, 'yyyy-MM'));
    }

    logger.debug(`Processing ${filteredEntries.length} entries for TOIL calculation for date: ${format(date, 'yyyy-MM-dd')}`);
    
    // Calculate TOIL hours
    const toilHours = calculateTOILHours(filteredEntries, date, workSchedule, holidays);
    
    // Added better validation to prevent insignificant TOIL amounts
    if (toilHours <= 0.01) {
      logger.debug(`No significant TOIL hours (${toilHours}) calculated for ${format(date, 'yyyy-MM-dd')}, skipping record creation`);
      return getTOILSummary(userId, format(date, 'yyyy-MM'));
    }
    
    // Find the primary entry to associate the TOIL record with
    const primaryEntry = [...filteredEntries].sort((a, b) => b.hours - a.hours)[0];
    const entryId = primaryEntry?.id;
    
    // Create a TOIL record
    const record: TOILRecord = {
      id: uuidv4(),
      userId,
      date,
      hours: toilHours,
      monthYear: format(date, 'yyyy-MM'),
      entryId: entryId || uuidv4(),
      status: 'active'
    };
    
    // Enhanced logging 
    logger.debug(`Creating TOIL record for ${format(date, 'yyyy-MM-dd')} with ${toilHours} hours`);
    
    // Store the record - the improved storeTOILRecord will handle duplicates
    const success = await storeTOILRecord(record);
    
    if (!success) {
      logger.error('Failed to store TOIL record');
      return null;
    }
    
    // Return the updated TOIL summary
    const monthYear = format(date, 'yyyy-MM');
    const summary = getTOILSummary(userId, monthYear);
    
    // Dispatch event using both the legacy and new systems
    timeEventsService.publish('toil-updated', {
      userId,
      date: date.toISOString(),
      summary
    });
    
    // Use EventBus for the centralized event system
    eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, summary);
    
    return summary;
  } catch (error) {
    logger.error('Error in TOIL calculation:', error);
    return null;
  }
}
