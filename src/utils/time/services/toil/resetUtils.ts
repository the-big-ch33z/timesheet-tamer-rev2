
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  clearAllTOILCaches,
  clearAllTOILDeletionTracking,
  DELETED_TOIL_RECORDS_KEY,
  DELETED_TOIL_USAGE_KEY
} from './storage';
import { attemptStorageOperation, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from './storage/core';

const logger = createTimeLogger('TOIL-ResetUtils');

/**
 * Completely reset all TOIL data for a user or globally
 * This includes both data and deletion tracking
 */
export async function resetTOILData(userId?: string): Promise<boolean> {
  try {
    logger.debug(`Resetting TOIL data${userId ? ` for user ${userId}` : ' globally'}`);
    
    if (userId) {
      // Reset data for specific user
      await resetUserTOILData(userId);
    } else {
      // Reset all TOIL data globally
      await resetAllTOILData();
    }
    
    logger.info(`TOIL data reset completed${userId ? ` for user ${userId}` : ' globally'}`);
    return true;
  } catch (error) {
    logger.error(`Error resetting TOIL data${userId ? ` for user ${userId}` : ''}:`, error);
    return false;
  }
}

/**
 * Reset TOIL data for a specific user
 */
async function resetUserTOILData(userId: string): Promise<void> {
  // Load current data
  const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
  const allUsage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
  
  // Filter out user's data
  const filteredRecords = allRecords.filter((record: any) => record.userId !== userId);
  const filteredUsage = allUsage.filter((usage: any) => usage.userId !== userId);
  
  // Save filtered data
  await attemptStorageOperation(
    () => {
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsage));
    },
    STORAGE_RETRY_DELAY,
    STORAGE_MAX_RETRIES
  );
  
  // Clear caches for this user
  clearAllTOILCaches();
  
  logger.debug(`Reset TOIL data for user ${userId}`);
}

/**
 * Reset all TOIL data globally
 */
async function resetAllTOILData(): Promise<void> {
  await attemptStorageOperation(
    () => {
      // Clear all TOIL data
      localStorage.removeItem(TOIL_RECORDS_KEY);
      localStorage.removeItem(TOIL_USAGE_KEY);
      
      // Clear deletion tracking
      localStorage.removeItem(DELETED_TOIL_RECORDS_KEY);
      localStorage.removeItem(DELETED_TOIL_USAGE_KEY);
    },
    STORAGE_RETRY_DELAY,
    STORAGE_MAX_RETRIES
  );
  
  // Clear all caches
  clearAllTOILCaches();
  
  logger.debug('Reset all TOIL data globally');
}

/**
 * Check if TOIL data exists for a user
 */
export function hasTOILData(userId: string): boolean {
  try {
    const records = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
    const usage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
    
    const hasRecords = records.some((record: any) => record.userId === userId);
    const hasUsage = usage.some((item: any) => item.userId === userId);
    
    return hasRecords || hasUsage;
  } catch (error) {
    logger.error('Error checking for TOIL data:', error);
    return false;
  }
}

/**
 * Get TOIL data statistics for debugging
 */
export function getTOILDataStats(userId?: string): {
  totalRecords: number;
  totalUsage: number;
  deletedRecords: number;
  deletedUsage: number;
} {
  try {
    const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
    const allUsage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
    const deletedRecords = JSON.parse(localStorage.getItem(DELETED_TOIL_RECORDS_KEY) || '[]');
    const deletedUsage = JSON.parse(localStorage.getItem(DELETED_TOIL_USAGE_KEY) || '[]');
    
    if (userId) {
      return {
        totalRecords: allRecords.filter((r: any) => r.userId === userId).length,
        totalUsage: allUsage.filter((u: any) => u.userId === userId).length,
        deletedRecords: deletedRecords.length, // This is global as IDs are unique
        deletedUsage: deletedUsage.length // This is global as IDs are unique
      };
    }
    
    return {
      totalRecords: allRecords.length,
      totalUsage: allUsage.length,
      deletedRecords: deletedRecords.length,
      deletedUsage: deletedUsage.length
    };
  } catch (error) {
    logger.error('Error getting TOIL data stats:', error);
    return { totalRecords: 0, totalUsage: 0, deletedRecords: 0, deletedUsage: 0 };
  }
}
