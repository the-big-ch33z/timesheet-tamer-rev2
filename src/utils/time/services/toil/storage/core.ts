
import { TOILRecord, TOILSummary, TOILUsage } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';
import { format } from 'date-fns';

const logger = createTimeLogger('TOIL-Storage-Core');

/**
 * Safely parse JSON with error handling
 */
export function safelyParseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Load TOIL records from storage
 */
export function loadTOILRecords(userId?: string): TOILRecord[] {
  try {
    const recordsJson = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!recordsJson) return [];
    
    const records: TOILRecord[] = JSON.parse(recordsJson);
    
    // Filter by userId if provided
    if (userId) {
      return records.filter(record => record.userId === userId);
    }
    
    return records;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load TOIL usage records from storage
 */
export function loadTOILUsage(userId?: string): TOILUsage[] {
  try {
    const usageJson = localStorage.getItem(TOIL_USAGE_KEY);
    if (!usageJson) return [];
    
    const usage: TOILUsage[] = JSON.parse(usageJson);
    
    // Filter by userId if provided
    if (userId) {
      return usage.filter(record => record.userId === userId);
    }
    
    return usage;
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Get TOIL records for a specific date
 */
export function getToilRecordsByDate(date: Date, userId?: string): TOILRecord[] {
  try {
    const records = loadTOILRecords(userId);
    return filterRecordsByDate(records, date);
  } catch (error) {
    logger.error('Error getting TOIL records by date:', error);
    return [];
  }
}

/**
 * Filter records by month
 */
export function filterRecordsByMonth(records: TOILRecord[], monthYear: string): TOILRecord[] {
  return records.filter(record => record.monthYear === monthYear);
}

/**
 * Helper to attempt storage operations with retry logic
 */
export async function attemptStorageOperation<T>(
  operation: () => T,
  retryDelay: number = STORAGE_RETRY_DELAY,
  maxRetries: number = STORAGE_MAX_RETRIES
): Promise<T> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      return operation();
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        logger.error(`Storage operation failed after ${attempts} attempts:`, error);
        throw error;
      }
      
      logger.warn(`Storage operation failed, retrying (${attempts}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error(`Storage operation failed after ${maxRetries} attempts`);
}

/**
 * Helper function to generate a summary cache key
 */
export function getSummaryCacheKey(userId: string, monthYear: string): string {
  return `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
}

/**
 * Filter records by entry ID
 */
export function filterRecordsByEntryId(records: TOILRecord[], entryId: string): TOILRecord[] {
  return records.filter(record => record.entryId === entryId);
}

/**
 * Filter records by date
 */
export function filterRecordsByDate(records: TOILRecord[], date: Date): TOILRecord[] {
  const dateString = format(date, 'yyyy-MM-dd');
  return records.filter(record => {
    const recordDateString = format(new Date(record.date), 'yyyy-MM-dd');
    return recordDateString === dateString;
  });
}

/**
 * Clear summary cache for a user and month
 */
export function clearSummaryCache(userId?: string, monthYear?: string): void {
  try {
    if (userId && monthYear) {
      // Clear specific cache
      const key = getSummaryCacheKey(userId, monthYear);
      localStorage.removeItem(key);
      logger.debug(`Cleared TOIL summary cache for ${userId}, ${monthYear}`);
      return;
    }
    
    // Clear all summary caches if no specific one is requested
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
        localStorage.removeItem(key);
        logger.debug(`Cleared TOIL summary cache: ${key}`);
      }
    }
  } catch (error) {
    logger.error('Error clearing TOIL summary cache:', error);
  }
}

/**
 * Clear all TOIL-related caches
 */
export function clearAllTOILCaches(): void {
  try {
    clearSummaryCache();
    logger.debug('Cleared all TOIL caches');
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
  }
}

/**
 * Clean up duplicate TOIL records by consolidating records for the same user and date
 * This helps prevent TOIL accumulation when navigating between dates
 */
export async function cleanupDuplicateTOILRecords(userId: string): Promise<number> {
  try {
    const allRecords = await loadTOILRecords();
    
    // Start with the count of all records to calculate how many were removed
    const startCount = allRecords.length;
    logger.debug(`Starting TOIL cleanup with ${startCount} total records`);
    
    // Group records by user+date
    const recordsByDateAndUser = new Map<string, TOILRecord[]>();
    
    for (const record of allRecords) {
      // Skip records that aren't for this user if a userId was specified
      if (userId && record.userId !== userId) continue;
      
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      const mapKey = `${record.userId}-${dateKey}`;
      
      if (!recordsByDateAndUser.has(mapKey)) {
        recordsByDateAndUser.set(mapKey, []);
      }
      
      recordsByDateAndUser.get(mapKey)!.push(record);
    }
    
    // Create a new array with consolidated records
    const consolidatedRecords: TOILRecord[] = [];
    
    // Add records from other users that we're not processing
    if (userId) {
      allRecords
        .filter(record => record.userId !== userId)
        .forEach(record => consolidatedRecords.push(record));
    }
    
    // Process each group of duplicate records
    let duplicatesFound = 0;
    
    recordsByDateAndUser.forEach((duplicates, mapKey) => {
      if (duplicates.length <= 1) {
        // No duplicates for this date+user, just add the record
        if (duplicates.length === 1) {
          consolidatedRecords.push(duplicates[0]);
        }
        return;
      }
      
      // Found duplicates, log and consolidate
      duplicatesFound += duplicates.length - 1;
      logger.debug(`Found ${duplicates.length} duplicate TOIL records for ${mapKey}`);
      
      // Sort by creation time (assuming newer records have higher IDs)
      duplicates.sort((a, b) => a.id.localeCompare(b.id));
      
      // Keep the most recent record
      const mostRecent = duplicates[duplicates.length - 1];
      consolidatedRecords.push(mostRecent);
      
      logger.debug(`Consolidated ${duplicates.length} records into one with ${mostRecent.hours} hours`);
    });
    
    // Only save if we found duplicates
    if (duplicatesFound > 0) {
      logger.debug(`Removing ${duplicatesFound} duplicate TOIL records`);
      
      await attemptStorageOperation(() => {
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(consolidatedRecords));
        return true;
      });
    } else {
      logger.debug(`No duplicate TOIL records found for cleanup`);
    }
    
    return duplicatesFound;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL records:', error);
    return 0;
  }
}
