
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_PREFIX,
  DELETED_TOIL_RECORDS_KEY,
  DELETED_TOIL_USAGE_KEY
} from './storage/constants';
import { attemptStorageOperation, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from './storage/core';

const logger = createTimeLogger('TOIL-UnifiedDeletion');

/**
 * MASTER DELETION FUNCTION - Unified TOIL data deletion
 * This function ONLY handles deletion and does NOT interfere with normal TOIL operations
 */
export async function deleteAllToilData(userId?: string): Promise<{
  success: boolean;
  deletedRecords: number;
  deletedUsage: number;
  deletedCaches: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedRecords = 0;
  let deletedUsage = 0;
  let deletedCaches = 0;

  try {
    logger.debug(`Starting unified TOIL deletion${userId ? ` for user ${userId}` : ' globally'}`);
    console.log(`[TOIL-DEBUG] ==> UNIFIED DELETION START${userId ? ` for user ${userId}` : ' globally'}`);

    // Step 1: Clear all toilSummary_* cache keys from localStorage
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_PREFIX)) {
          // If userId specified, only clear caches for that user
          if (!userId || key.includes(`_${userId}_`)) {
            keys.push(key);
          }
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key));
      deletedCaches = keys.length;
      
      console.log(`[TOIL-DEBUG] ✅ Cleared ${deletedCaches} TOIL cache entries`);
      logger.debug(`Cleared ${deletedCaches} TOIL cache entries`);
    } catch (error) {
      const errorMsg = `Failed to clear TOIL caches: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      console.log(`[TOIL-DEBUG] ❌ ${errorMsg}`);
    }

    // Step 2: Remove toilRecords from localStorage
    try {
      await attemptStorageOperation(
        () => {
          if (userId) {
            // Remove only records for specific user
            const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
            const filteredRecords = allRecords.filter((record: any) => record.userId !== userId);
            deletedRecords = allRecords.length - filteredRecords.length;
            localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
          } else {
            // Remove all records globally
            const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
            deletedRecords = allRecords.length;
            localStorage.removeItem(TOIL_RECORDS_KEY);
          }
        },
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      console.log(`[TOIL-DEBUG] ✅ Deleted ${deletedRecords} TOIL records`);
      logger.debug(`Deleted ${deletedRecords} TOIL records`);
    } catch (error) {
      const errorMsg = `Failed to delete TOIL records: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      console.log(`[TOIL-DEBUG] ❌ ${errorMsg}`);
    }

    // Step 3: Remove toilUsage from localStorage  
    try {
      await attemptStorageOperation(
        () => {
          if (userId) {
            // Remove only usage for specific user
            const allUsage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
            const filteredUsage = allUsage.filter((usage: any) => usage.userId !== userId);
            deletedUsage = allUsage.length - filteredUsage.length;
            localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsage));
          } else {
            // Remove all usage globally
            const allUsage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
            deletedUsage = allUsage.length;
            localStorage.removeItem(TOIL_USAGE_KEY);
          }
        },
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      console.log(`[TOIL-DEBUG] ✅ Deleted ${deletedUsage} TOIL usage entries`);
      logger.debug(`Deleted ${deletedUsage} TOIL usage entries`);
    } catch (error) {
      const errorMsg = `Failed to delete TOIL usage: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      console.log(`[TOIL-DEBUG] ❌ ${errorMsg}`);
    }

    // Step 4: Clear any TOIL deletion tracking arrays
    try {
      await attemptStorageOperation(
        () => {
          if (userId) {
            // For specific user, we'd need to filter deletion tracking
            // But since these are just IDs, we'll clear them globally for safety
            localStorage.removeItem(DELETED_TOIL_RECORDS_KEY);
            localStorage.removeItem(DELETED_TOIL_USAGE_KEY);
          } else {
            // Clear globally
            localStorage.removeItem(DELETED_TOIL_RECORDS_KEY);
            localStorage.removeItem(DELETED_TOIL_USAGE_KEY);
          }
        },
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      console.log(`[TOIL-DEBUG] ✅ Cleared TOIL deletion tracking`);
      logger.debug('Cleared TOIL deletion tracking');
    } catch (error) {
      const errorMsg = `Failed to clear TOIL deletion tracking: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      console.log(`[TOIL-DEBUG] ❌ ${errorMsg}`);
    }

    // Step 5: Update UI state to reflect complete removal
    try {
      // Dispatch a DOM event to notify UI components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toil:unified-deletion-complete', {
          detail: {
            userId,
            deletedRecords,
            deletedUsage,
            deletedCaches,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }
      
      console.log(`[TOIL-DEBUG] ✅ UI state update dispatched`);
      logger.debug('UI state update dispatched');
    } catch (error) {
      const errorMsg = `Failed to update UI state: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      console.log(`[TOIL-DEBUG] ❌ ${errorMsg}`);
    }

    const success = errors.length === 0;
    const totalDeleted = deletedRecords + deletedUsage + deletedCaches;
    
    console.log(`[TOIL-DEBUG] ==> UNIFIED DELETION COMPLETE: ${success ? 'SUCCESS' : 'PARTIAL'} - ${totalDeleted} items deleted, ${errors.length} errors`);
    logger.info(`Unified TOIL deletion completed: ${success ? 'success' : 'partial'} - deleted ${totalDeleted} items with ${errors.length} errors`);

    return {
      success,
      deletedRecords,
      deletedUsage,
      deletedCaches,
      errors
    };
  } catch (error) {
    const errorMsg = `Critical error in unified TOIL deletion: ${error}`;
    errors.push(errorMsg);
    logger.error(errorMsg);
    console.log(`[TOIL-DEBUG] ❌ CRITICAL ERROR: ${errorMsg}`);
    
    return {
      success: false,
      deletedRecords,
      deletedUsage,
      deletedCaches,
      errors
    };
  }
}

/**
 * Helper function to trigger UI state update after deletion
 */
export function triggerUIStateUpdate(): void {
  try {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toil:data-cleared', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      console.log(`[TOIL-DEBUG] ✅ UI state update triggered`);
    }
  } catch (error) {
    logger.error('Failed to trigger UI state update:', error);
    console.log(`[TOIL-DEBUG] ❌ Failed to trigger UI state update: ${error}`);
  }
}
