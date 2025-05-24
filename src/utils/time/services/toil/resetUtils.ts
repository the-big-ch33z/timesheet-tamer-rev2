import { createTimeLogger } from '@/utils/time/errors';
import { deleteAllToilData, DeletionResult } from './unifiedDeletion';

const logger = createTimeLogger('TOIL-ResetUtils');

/**
 * Reset all TOIL data for a user or globally using the unified deletion function
 */
export async function resetTOILData(userId?: string): Promise<boolean> {
  try {
    logger.debug(`Resetting TOIL data${userId ? ` for user ${userId}` : ' globally'}`);
    console.log(`[TOIL-DEBUG] ==> RESET TOIL DATA ${userId ? `for user ${userId}` : 'GLOBALLY'}`);
    
    // Use the unified deletion function
    const result: DeletionResult = await deleteAllToilData(userId);
    
    if (result.success) {
      logger.info(`TOIL data reset completed${userId ? ` for user ${userId}` : ' globally'}`);
      console.log(`[TOIL-DEBUG] ✅ RESET COMPLETED successfully`, result);
      return true;
    } else {
      logger.error(`TOIL data reset failed${userId ? ` for user ${userId}` : ''}:`, result.errors);
      console.error(`[TOIL-DEBUG] ❌ RESET FAILED:`, result.errors);
      return false;
    }
  } catch (error) {
    logger.error(`Error resetting TOIL data${userId ? ` for user ${userId}` : ''}:`, error);
    console.error(`[TOIL-DEBUG] ❌ RESET ERROR:`, error);
    return false;
  }
}

// Keep existing utility functions but mark as deprecated
/**
 * @deprecated Use deleteAllToilData() from unifiedDeletion.ts instead
 */
export async function manualStorageCleanup(): Promise<{ 
  success: boolean; 
  recordsFixed: number; 
  usageFixed: number; 
  errors: string[] 
}> {
  console.warn('[TOIL-DEBUG] ⚠️ manualStorageCleanup is deprecated, using unified deletion instead');
  
  const result = await deleteAllToilData();
  
  return {
    success: result.success,
    recordsFixed: result.summary.recordsRemoved ? 1 : 0,
    usageFixed: result.summary.usageRemoved ? 1 : 0,
    errors: result.errors
  };
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
    const records = JSON.parse(localStorage.getItem('toilRecords') || '[]');
    const usage = JSON.parse(localStorage.getItem('toilUsage') || '[]');
    const deletedRecords = JSON.parse(localStorage.getItem('toil-records-deleted') || '[]');
    const deletedUsage = JSON.parse(localStorage.getItem('toil-usage-deleted') || '[]');
    
    return {
      rawRecordsCount: records.length,
      rawUsageCount: usage.length,
      deletedRecordsCount: deletedRecords.length,
      deletedUsageCount: deletedUsage.length,
      inconsistentRecords: 0,
      inconsistentUsage: 0
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
    const records = JSON.parse(localStorage.getItem('toilRecords') || '[]');
    const usage = JSON.parse(localStorage.getItem('toilUsage') || '[]');
    
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
    const allRecords = JSON.parse(localStorage.getItem('toilRecords') || '[]');
    const allUsage = JSON.parse(localStorage.getItem('toilUsage') || '[]');
    const deletedRecords = JSON.parse(localStorage.getItem('toil-records-deleted') || '[]');
    const deletedUsage = JSON.parse(localStorage.getItem('toil-usage-deleted') || '[]');
    
    if (userId) {
      return {
        totalRecords: allRecords.filter((r: any) => r.userId === userId).length,
        totalUsage: allUsage.filter((u: any) => u.userId === userId).length,
        deletedRecords: deletedRecords.length,
        deletedUsage: deletedUsage.length
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
