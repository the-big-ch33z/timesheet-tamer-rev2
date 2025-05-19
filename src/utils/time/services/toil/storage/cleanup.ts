import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOILRecord } from '@/types/toil';
import { loadTOILRecords } from './core';
import { attemptStorageOperation } from './core';
import { TOIL_RECORDS_KEY, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from './constants';

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
