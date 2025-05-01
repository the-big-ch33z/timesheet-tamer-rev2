
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILRecord, TOILSummary } from "@/types/toil";
import { v4 as uuidv4 } from "uuid";
import { createTOILRecord, calculateTOILHours } from "./calculation";
import { storeTOILRecord, getTOILSummary, cleanupDuplicateTOILRecords } from "./storage";
import { createTimeLogger } from '@/utils/time/errors';
import { format, isSameMonth } from 'date-fns';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('TOILBatchProcessor');

// Track recently processed dates to prevent redundant calculations
const recentlyProcessed = new Map<string, number>();
const RECENT_THRESHOLD_MS = 2000; // 2 seconds

/**
 * Check if a date was recently processed for a user
 */
export function hasRecentlyProcessed(userId: string, date: Date): boolean {
  const dateKey = `${userId}-${date.toISOString().slice(0, 10)}`;
  const lastProcessed = recentlyProcessed.get(dateKey);
  
  if (!lastProcessed) {
    return false;
  }
  
  return Date.now() - lastProcessed < RECENT_THRESHOLD_MS;
}

/**
 * Clear the recent processing cache
 */
export function clearRecentProcessing(): void {
  recentlyProcessed.clear();
  logger.debug('Cleared recently processed cache');
}

/**
 * Perform a TOIL calculation for a single batch of entries
 * FIXED: Added cleanup call and improved validation to prevent duplicate/incorrect records
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
      return getTOILSummary(userId, date.toISOString().slice(0, 7));
    }

    logger.debug(`Processing ${filteredEntries.length} entries for TOIL calculation for date: ${format(date, 'yyyy-MM-dd')}`);
    
    // Calculate TOIL hours - This now correctly calculates only excess hours as TOIL
    const toilHours = calculateTOILHours(filteredEntries, date, workSchedule, holidays);
    
    // Mark this date as recently processed
    const dateKey = `${userId}-${date.toISOString().slice(0, 10)}`;
    recentlyProcessed.set(dateKey, Date.now());
    
    // Remove old keys to prevent memory leaks
    if (recentlyProcessed.size > 100) {
      const oldestEntries = Array.from(recentlyProcessed.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 50);
        
      oldestEntries.forEach(([key]) => recentlyProcessed.delete(key));
    }
    
    // FIXED: Added better validation to prevent insignificant TOIL amounts
    if (toilHours <= 0.01) {
      logger.debug(`No significant TOIL hours (${toilHours}) calculated for ${format(date, 'yyyy-MM-dd')}, skipping record creation`);
      return getTOILSummary(userId, date.toISOString().slice(0, 7));
    }
    
    // Find the primary entry to associate the TOIL record with
    const primaryEntry = [...filteredEntries].sort((a, b) => b.hours - a.hours)[0];
    const entryId = primaryEntry?.id;
    
    // Create a TOIL record
    const record = createTOILRecord(userId, date, toilHours, entryId);
    
    // Enhanced logging 
    logger.debug(`Creating TOIL record for ${format(date, 'yyyy-MM-dd')} with ${toilHours} hours`);
    
    // Store the record - the improved storeTOILRecord will handle duplicates
    const success = await storeTOILRecord(record);
    
    if (!success) {
      logger.error('Failed to store TOIL record');
      return null;
    }
    
    // Return the updated TOIL summary
    const monthYear = date.toISOString().slice(0, 7);
    const summary = getTOILSummary(userId, monthYear);
    
    // Dispatch event to notify subscribers of TOIL update
    timeEventsService.publish('toil-updated', {
      userId,
      date: date.toISOString(),
      summary
    });
    
    return summary;
  } catch (error) {
    logger.error('Error in TOIL calculation:', error);
    return null;
  }
}
