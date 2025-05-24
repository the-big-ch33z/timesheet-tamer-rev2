import { createTimeLogger } from '@/utils/time/errors';
import { deleteAllToilData } from './unifiedDeletion';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  clearAllTOILCaches,
  clearAllTOILDeletionTracking,
  DELETED_TOIL_RECORDS_KEY,
  DELETED_TOIL_USAGE_KEY,
  loadRawTOILRecords,
  loadRawTOILUsage,
  checkAndFixStorageConsistency
} from './storage';
import { attemptStorageOperation, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from './storage/core';

const logger = createTimeLogger('TOIL-ResetUtils');

/**
 * Completely reset all TOIL data for a user or globally
 * Now uses the unified deletion function
 */
export async function resetTOILData(userId?: string): Promise<boolean> {
  try {
    logger.debug(`Resetting TOIL data${userId ? ` for user ${userId}` : ' globally'}`);
    
    // Use the unified deletion function
    const result = await deleteAllToilData(userId);
    
    if (result.success) {
      logger.info(`TOIL data reset completed${userId ? ` for user ${userId}` : ' globally'}: ${result.deletedRecords} records, ${result.deletedUsage} usage, ${result.deletedCaches} caches deleted`);
      return true;
    } else {
      logger.error(`TOIL data reset failed${userId ? ` for user ${userId}` : ''}: ${result.errors.join(', ')}`);
      return false;
    }
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
 * Manually clean up storage inconsistencies
 * This function can be called to fix cases where deletion tracking and storage are out of sync
 */
export async function manualStorageCleanup(): Promise<{ 
  success: boolean; 
  recordsFixed: number; 
  usageFixed: number; 
  errors: string[] 
}> {
  const errors: string[] = [];
  
  try {
    logger.debug('Starting manual TOIL storage cleanup...');
    
    // Run storage consistency check
    const consistencyResult = await checkAndFixStorageConsistency();
    
    // Clear all caches to ensure fresh data
    clearAllTOILCaches();
    
    logger.info(`Manual storage cleanup completed: fixed ${consistencyResult.recordsFixed} records and ${consistencyResult.usageFixed} usage items`);
    
    return {
      success: true,
      recordsFixed: consistencyResult.recordsFixed,
      usageFixed: consistencyResult.usageFixed,
      errors
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(errorMsg);
    logger.error('Error during manual storage cleanup:', error);
    
    return {
      success: false,
      recordsFixed: 0,
      usageFixed: 0,
      errors
    };
  }
}

/**
 * Get storage diagnostic information for debugging
 */
export function getStorageDiagnostics(): {
  rawRecordsCount: number;
  rawUsageCount: number;
  deletedRecordsCount: number;
  deletedUsageCount: number;
  inconsistentRecords: number;
  inconsistentUsage: number;
} {
  try {
    const rawRecords = loadRawTOILRecords();
    const rawUsage = loadRawTOILUsage();
    const deletedRecordIds = JSON.parse(localStorage.getItem(DELETED_TOIL_RECORDS_KEY) || '[]');
    const deletedUsageIds = JSON.parse(localStorage.getItem(DELETED_TOIL_USAGE_KEY) || '[]');
    
    // Count inconsistencies
    const inconsistentRecords = rawRecords.filter(record => deletedRecordIds.includes(record.id)).length;
    const inconsistentUsage = rawUsage.filter(usage => deletedUsageIds.includes(usage.id)).length;
    
    return {
      rawRecordsCount: rawRecords.length,
      rawUsageCount: rawUsage.length,
      deletedRecordsCount: deletedRecordIds.length,
      deletedUsageCount: deletedUsageIds.length,
      inconsistentRecords,
      inconsistentUsage
    };
  } catch (error) {
    logger.error('Error getting storage diagnostics:', error);
    return {
      rawRecordsCount: 0,
      rawUsageCount: 0,
      deletedRecordsCount: 0,
      deletedUsageCount: 0,
      inconsistentRecords: 0,
      inconsistentUsage: 0
    };
  }
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
