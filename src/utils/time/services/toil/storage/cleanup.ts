import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOILRecord } from '@/types/toil';
import { loadTOILRecords, loadTOILUsage } from './core';
import { attemptStorageOperation } from './core';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from './constants';

const logger = createTimeLogger('TOIL-Storage-Cleanup');

/**
 * Clean up expired TOIL records
 * @param userId Optional user ID to clean up records for a specific user
 * @returns Number of records cleaned up
 */
export async function cleanupExpiredRecords(userId?: string): Promise<number> {
  try {
    logger.debug('Starting expired TOIL records cleanup');
    
    // Load all records
    const allRecords = loadTOILRecords();
    
    // Determine which records need to be marked as expired
    let recordsToUpdate: TOILRecord[] = [];
    let recordsToKeep: TOILRecord[] = [];
    let expiredCount = 0;
    
    // Current date in ISO format
    const currentDate = new Date();
    
    // Process each record
    for (const record of allRecords) {
      // Skip records for other users if userId specified
      if (userId && record.userId !== userId) {
        recordsToKeep.push(record);
        continue;
      }
      
      // Skip already expired or used records
      if (record.status !== 'active') {
        recordsToKeep.push(record);
        continue;
      }
      
      // Check if the record is expired
      const recordDate = new Date(record.date);
      const isExpired = calculateIsExpired(recordDate, currentDate);
      
      if (isExpired) {
        const expiredRecord: TOILRecord = {
          ...record,
          status: 'expired'
        };
        recordsToUpdate.push(expiredRecord);
        expiredCount++;
      } else {
        recordsToKeep.push(record);
      }
    }
    
    // If there are no expired records, return early
    if (expiredCount === 0) {
      logger.debug('No expired TOIL records to clean up');
      return 0;
    }
    
    // Combine updated and unchanged records
    const updatedRecords = [...recordsToKeep, ...recordsToUpdate];
    
    // Store the updated records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Cleaned up ${expiredCount} expired TOIL records`);
    return expiredCount;
  } catch (error) {
    logger.error(`Error cleaning up expired records:`, error);
    return 0;
  }
}

/**
 * Calculate if a TOIL record is expired
 * @param recordDate Date of the TOIL record
 * @param currentDate Current date to compare against
 * @returns True if the record is expired
 */
function calculateIsExpired(recordDate: Date, currentDate: Date): boolean {
  // Example expiration logic - TOIL expires after 6 months
  const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
  return currentDate.getTime() - recordDate.getTime() > sixMonthsInMs;
}

/**
 * Force cleanup of all TOIL records older than specified days
 * Used for administrative purges
 * @param days Number of days to keep records for
 * @returns Number of records deleted
 */
export async function forceCleanupOldRecords(days: number): Promise<number> {
  try {
    logger.debug(`Forcing cleanup of TOIL records older than ${days} days`);
    
    // Load all records
    const allRecords = loadTOILRecords();
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Filter out old records
    const recordsToKeep = allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= cutoffDate;
    });
    
    const deletedCount = allRecords.length - recordsToKeep.length;
    
    if (deletedCount === 0) {
      logger.debug('No old TOIL records to clean up');
      return 0;
    }
    
    // Store the updated records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(recordsToKeep)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Deleted ${deletedCount} old TOIL records`);
    return deletedCount;
  } catch (error) {
    logger.error(`Error forcing cleanup of old records:`, error);
    return 0;
  }
}

/**
 * Clean up duplicate TOIL records
 * @param userId Optional user ID to clean up records for
 * @returns Number of duplicates removed
 */
export async function cleanupDuplicateTOILRecords(userId?: string): Promise<number> {
  try {
    logger.debug('Starting duplicate TOIL records cleanup');
    
    // Load all records
    const allRecords = loadTOILRecords();
    
    // Track unique record IDs
    const recordIds = new Set<string>();
    const uniqueRecords: TOILRecord[] = [];
    let duplicateCount = 0;
    
    for (const record of allRecords) {
      // Skip records for other users if userId specified
      if (userId && record.userId !== userId) {
        uniqueRecords.push(record);
        continue;
      }
      
      // Check if we've seen this ID before
      if (!recordIds.has(record.id)) {
        recordIds.add(record.id);
        uniqueRecords.push(record);
      } else {
        // This is a duplicate
        duplicateCount++;
      }
    }
    
    // If there are no duplicates, return early
    if (duplicateCount === 0) {
      logger.debug('No duplicate TOIL records found');
      return 0;
    }
    
    // Store the deduplicated records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(uniqueRecords)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Cleaned up ${duplicateCount} duplicate TOIL records`);
    return duplicateCount;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL records:`, error);
    return 0;
  }
}

/**
 * Clean up duplicate TOIL usage records
 * @param userId Optional user ID to clean up records for
 * @returns Number of duplicates removed
 */
export async function cleanupDuplicateTOILUsage(userId?: string): Promise<number> {
  try {
    logger.debug('Starting duplicate TOIL usage cleanup');
    
    // Load all usage records
    const allUsage = loadTOILUsage();
    
    // Track unique usage IDs
    const usageIds = new Set<string>();
    const uniqueUsage: any[] = [];
    let duplicateCount = 0;
    
    for (const usage of allUsage) {
      // Skip records for other users if userId specified
      if (userId && usage.userId !== userId) {
        uniqueUsage.push(usage);
        continue;
      }
      
      // Check if we've seen this ID before
      if (!usageIds.has(usage.id)) {
        usageIds.add(usage.id);
        uniqueUsage.push(usage);
      } else {
        // This is a duplicate
        duplicateCount++;
      }
    }
    
    // If there are no duplicates, return early
    if (duplicateCount === 0) {
      logger.debug('No duplicate TOIL usage records found');
      return 0;
    }
    
    // Store the deduplicated usage records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(uniqueUsage)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Cleaned up ${duplicateCount} duplicate TOIL usage records`);
    return duplicateCount;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL usage:`, error);
    return 0;
  }
}

/**
 * Clear TOIL storage for a specific month
 * @param userId User ID
 * @param monthYear Month year in format 'YYYY-MM'
 * @returns True if successful, false otherwise
 */
export async function clearTOILStorageForMonth(userId: string, monthYear: string): Promise<boolean> {
  try {
    logger.debug(`Clearing TOIL storage for ${userId}, ${monthYear}`);
    
    // Load all records
    const allRecords = loadTOILRecords();
    const allUsage = loadTOILUsage();
    
    // Filter out records for the specified month and user
    const updatedRecords = allRecords.filter(record => {
      if (record.userId !== userId) return true;
      
      // Keep records from other months
      const recordMonth = format(new Date(record.date), 'yyyy-MM');
      return recordMonth !== monthYear;
    });
    
    // Filter out usage for the specified month and user
    const updatedUsage = allUsage.filter(usage => {
      if (usage.userId !== userId) return true;
      
      // Keep usage from other months
      const usageMonth = format(new Date(usage.date), 'yyyy-MM');
      return usageMonth !== monthYear;
    });
    
    // Store the updated records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    // Store the updated usage
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(updatedUsage)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    // Clear any cached summary for this month
    const summaryKey = `toil_summary_${userId}_${monthYear}`;
    localStorage.removeItem(summaryKey);
    
    logger.debug(`Successfully cleared TOIL data for ${userId}, ${monthYear}`);
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL storage for month:`, error);
    return false;
  }
}

/**
 * Batch cleanup TOIL data - runs multiple cleanup operations
 * @returns Object with counts of cleanup operations
 */
export async function batchCleanupTOILData(): Promise<{
  expired: number;
  duplicateRecords: number;
  duplicateUsage: number;
}> {
  try {
    logger.debug('Starting batch TOIL data cleanup');
    
    // Run all cleanup operations
    const expired = await cleanupExpiredRecords();
    const duplicateRecords = await cleanupDuplicateTOILRecords();
    const duplicateUsage = await cleanupDuplicateTOILUsage();
    
    logger.debug(`Batch cleanup complete: ${expired} expired, ${duplicateRecords} duplicate records, ${duplicateUsage} duplicate usage`);
    
    return {
      expired,
      duplicateRecords,
      duplicateUsage
    };
  } catch (error) {
    logger.error(`Error in batch TOIL data cleanup:`, error);
    return {
      expired: 0,
      duplicateRecords: 0,
      duplicateUsage: 0
    };
  }
}
