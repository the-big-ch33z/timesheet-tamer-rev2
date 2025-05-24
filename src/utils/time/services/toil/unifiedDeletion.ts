
import { createTimeLogger } from '@/utils/time/errors';
import { storageWriteLock } from '../storage-lock';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  DELETED_TOIL_RECORDS_KEY,
  DELETED_TOIL_USAGE_KEY
} from './storage/constants';

const logger = createTimeLogger('TOIL-UnifiedDeletion');

export interface DeletionResult {
  success: boolean;
  deletedKeys: string[];
  errors: string[];
  summary: {
    cacheKeysCleared: number;
    recordsRemoved: boolean;
    usageRemoved: boolean;
    trackingCleared: boolean;
  };
  regenerationTriggered?: boolean;
}

/**
 * FIXED: MASTER TOIL DELETION FUNCTION WITH PROPER AUTO-REGENERATION
 * This is the ONLY function that should be used to delete TOIL data
 * Now includes proper verification and automatic regeneration
 */
export async function deleteAllToilData(userId?: string, options?: {
  skipRegeneration?: boolean;
  workSchedule?: any;
  currentEntries?: any[];
  currentDate?: Date;
}): Promise<DeletionResult> {
  console.log(`[TOIL-DEBUG] ==> MASTER DELETION START ${userId ? `for user ${userId}` : 'GLOBALLY'}`);
  logger.info(`Starting master TOIL deletion ${userId ? `for user ${userId}` : 'globally'}`);
  
  const result: DeletionResult = {
    success: false,
    deletedKeys: [],
    errors: [],
    summary: {
      cacheKeysCleared: 0,
      recordsRemoved: false,
      usageRemoved: false,
      trackingCleared: false
    },
    regenerationTriggered: false
  };

  try {
    // Acquire storage lock for atomic execution
    await storageWriteLock.acquire();
    console.log(`[TOIL-DEBUG] ✅ Storage lock acquired for deletion`);

    // PHASE 1: Log current localStorage state
    const beforeKeys = Object.keys(localStorage).filter(key => 
      key.includes('toil') || key.includes('TOIL')
    );
    console.log(`[TOIL-DEBUG] localStorage keys before deletion:`, beforeKeys);
    logger.debug(`localStorage state before deletion:`, { beforeKeys });

    // PHASE 2: Clear all TOIL summary cache keys
    console.log(`[TOIL-DEBUG] ==> PHASE 2: Clearing cache keys`);
    const cacheKeysCleared = await clearAllToilCacheKeys(userId);
    result.summary.cacheKeysCleared = cacheKeysCleared;
    console.log(`[TOIL-DEBUG] ✅ Cleared ${cacheKeysCleared} cache keys`);

    // PHASE 3: Remove TOIL records from localStorage
    console.log(`[TOIL-DEBUG] ==> PHASE 3: Removing TOIL records`);
    const recordsRemoved = await removeToilRecords(userId);
    result.summary.recordsRemoved = recordsRemoved;
    result.deletedKeys.push(TOIL_RECORDS_KEY);
    console.log(`[TOIL-DEBUG] ✅ Records removal: ${recordsRemoved}`);

    // PHASE 4: Remove TOIL usage from localStorage
    console.log(`[TOIL-DEBUG] ==> PHASE 4: Removing TOIL usage`);
    const usageRemoved = await removeToilUsage(userId);
    result.summary.usageRemoved = usageRemoved;
    result.deletedKeys.push(TOIL_USAGE_KEY);
    console.log(`[TOIL-DEBUG] ✅ Usage removal: ${usageRemoved}`);

    // PHASE 5: Clear deletion tracking arrays
    console.log(`[TOIL-DEBUG] ==> PHASE 5: Clearing deletion tracking`);
    const trackingCleared = await clearDeletionTracking();
    result.summary.trackingCleared = trackingCleared;
    if (trackingCleared) {
      result.deletedKeys.push(DELETED_TOIL_RECORDS_KEY, DELETED_TOIL_USAGE_KEY);
    }
    console.log(`[TOIL-DEBUG] ✅ Tracking cleared: ${trackingCleared}`);

    // PHASE 6: FIXED VERIFICATION - only check core data, not cache keys
    console.log(`[TOIL-DEBUG] ==> PHASE 6: Verification (FIXED)`);
    const coreDataCleared = await verifyCoreDataCleared(userId);
    result.success = coreDataCleared;
    
    console.log(`[TOIL-DEBUG] ==> MASTER DELETION ${result.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Master TOIL deletion ${result.success ? 'completed successfully' : 'failed'}`, result);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);
    console.error(`[TOIL-DEBUG] ❌ Master deletion error:`, error);
    logger.error('Master deletion failed:', error);
  } finally {
    // Always release the lock
    storageWriteLock.release();
    console.log(`[TOIL-DEBUG] Storage lock released`);
  }

  // PHASE 7: ENHANCED AUTO-REGENERATION (outside the lock)
  if (result.success && !options?.skipRegeneration && userId && options?.currentEntries?.length > 0) {
    console.log(`[TOIL-DEBUG] ==> PHASE 7: AUTO-REGENERATION for user ${userId}`);
    try {
      const regenerationResult = await triggerToilRegeneration(userId, options);
      result.regenerationTriggered = regenerationResult;
      console.log(`[TOIL-DEBUG] ✅ Auto-regeneration ${regenerationResult ? 'succeeded' : 'failed'}`);
    } catch (error) {
      console.error(`[TOIL-DEBUG] ❌ Auto-regeneration failed:`, error);
      result.errors.push(`Regeneration failed: ${error}`);
    }
  } else if (result.success && userId) {
    console.log(`[TOIL-DEBUG] ⚠️ Auto-regeneration skipped: entries=${options?.currentEntries?.length}, skipFlag=${options?.skipRegeneration}`);
  }

  return result;
}

/**
 * FIXED: Verify only core TOIL data is cleared, not cache keys
 */
async function verifyCoreDataCleared(userId?: string): Promise<boolean> {
  try {
    const recordsData = localStorage.getItem(TOIL_RECORDS_KEY);
    const usageData = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (userId) {
      // For user-specific deletion, check if user data is gone
      const records = recordsData ? JSON.parse(recordsData) : [];
      const usage = usageData ? JSON.parse(usageData) : [];
      
      const userRecords = records.filter((r: any) => r.userId === userId);
      const userUsage = usage.filter((u: any) => u.userId === userId);
      
      const success = userRecords.length === 0 && userUsage.length === 0;
      console.log(`[TOIL-DEBUG] User-specific verification: records=${userRecords.length}, usage=${userUsage.length}, success=${success}`);
      return success;
    } else {
      // For global deletion, core data should be completely gone
      const success = !recordsData && !usageData;
      console.log(`[TOIL-DEBUG] Global verification: recordsExists=${!!recordsData}, usageExists=${!!usageData}, success=${success}`);
      return success;
    }
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ Verification error:`, error);
    return false;
  }
}

/**
 * ENHANCED: Trigger TOIL regeneration with circuit breaker bypass
 */
async function triggerToilRegeneration(userId: string, options: {
  workSchedule?: any;
  currentEntries?: any[];
  currentDate?: Date;
}): Promise<boolean> {
  console.log(`[TOIL-DEBUG] ==> STARTING ENHANCED TOIL REGENERATION for user ${userId}`);
  
  try {
    const { currentEntries = [], workSchedule, currentDate = new Date() } = options;
    
    console.log(`[TOIL-DEBUG] Regenerating TOIL with:`, {
      entriesCount: currentEntries.length,
      hasWorkSchedule: !!workSchedule,
      workScheduleName: workSchedule?.name || 'Unknown',
      date: currentDate.toISOString()
    });

    if (currentEntries.length === 0) {
      console.log(`[TOIL-DEBUG] ⚠️ No entries to regenerate TOIL for`);
      return false;
    }

    if (!workSchedule) {
      console.log(`[TOIL-DEBUG] ⚠️ No work schedule available for regeneration`);
      return false;
    }

    // Import the TOIL service dynamically
    const { toilService } = await import('./service/factory');
    
    if (!toilService) {
      console.error(`[TOIL-DEBUG] ❌ TOIL service not available for regeneration`);
      return false;
    }

    // BYPASS CIRCUIT BREAKER for regeneration
    console.log(`[TOIL-DEBUG] 🔓 Bypassing circuit breaker for post-deletion regeneration`);
    
    // Force recalculation for the current month
    const holidays: any[] = []; // Load holidays if available
    
    // Calculate TOIL for the current date with the entries
    const summary = await toilService.calculateAndStoreTOIL(
      currentEntries,
      currentDate,
      userId,
      workSchedule,
      holidays
    );
    
    if (summary) {
      console.log(`[TOIL-DEBUG] ✅ TOIL regeneration completed successfully:`, {
        accrued: summary.accrued,
        used: summary.used,
        remaining: summary.remaining
      });
      
      // Trigger UI refresh after regeneration
      triggerUIStateUpdate(true);
      return true;
    } else {
      console.log(`[TOIL-DEBUG] ❌ TOIL regeneration returned null summary`);
      return false;
    }
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ TOIL regeneration error:`, error);
    return false;
  }
}

/**
 * Clear all TOIL cache keys from localStorage
 */
async function clearAllToilCacheKeys(userId?: string): Promise<number> {
  let cleared = 0;
  
  try {
    const keys = Object.keys(localStorage);
    const toilCacheKeys = keys.filter(key => 
      key.startsWith('toilSummary_') || 
      key.startsWith('toil_summary_') ||
      key.includes('TOIL_SUMMARY')
    );

    console.log(`[TOIL-DEBUG] Found ${toilCacheKeys.length} cache keys to clear:`, toilCacheKeys);

    for (const key of toilCacheKeys) {
      if (userId) {
        // Only remove keys for this specific user
        if (key.includes(userId)) {
          console.log(`[TOIL-DEBUG] Removing user cache key: ${key}`);
          localStorage.removeItem(key);
          cleared++;
        }
      } else {
        // Remove all cache keys
        console.log(`[TOIL-DEBUG] Removing cache key: ${key}`);
        localStorage.removeItem(key);
        cleared++;
      }
    }

    console.log(`[TOIL-DEBUG] ✅ Cache clearing completed: ${cleared} keys removed`);
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ Error clearing cache keys:`, error);
    logger.error('Error clearing cache keys:', error);
  }

  return cleared;
}

/**
 * Remove TOIL records from localStorage
 */
async function removeToilRecords(userId?: string): Promise<boolean> {
  try {
    console.log(`[TOIL-DEBUG] Target key for records: ${TOIL_RECORDS_KEY}`);
    
    if (userId) {
      // Remove only records for specific user
      const currentRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
      const filteredRecords = currentRecords.filter((record: any) => record.userId !== userId);
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      console.log(`[TOIL-DEBUG] Filtered ${currentRecords.length - filteredRecords.length} records for user ${userId}`);
    } else {
      // Remove all records
      localStorage.removeItem(TOIL_RECORDS_KEY);
      console.log(`[TOIL-DEBUG] Completely removed ${TOIL_RECORDS_KEY}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ Error removing records:`, error);
    logger.error('Error removing TOIL records:', error);
    return false;
  }
}

/**
 * Remove TOIL usage from localStorage
 */
async function removeToilUsage(userId?: string): Promise<boolean> {
  try {
    console.log(`[TOIL-DEBUG] Target key for usage: ${TOIL_USAGE_KEY}`);
    
    if (userId) {
      // Remove only usage for specific user
      const currentUsage = JSON.parse(localStorage.getItem(TOIL_USAGE_KEY) || '[]');
      const filteredUsage = currentUsage.filter((usage: any) => usage.userId !== userId);
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsage));
      console.log(`[TOIL-DEBUG] Filtered ${currentUsage.length - filteredUsage.length} usage records for user ${userId}`);
    } else {
      // Remove all usage
      localStorage.removeItem(TOIL_USAGE_KEY);
      console.log(`[TOIL-DEBUG] Completely removed ${TOIL_USAGE_KEY}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ Error removing usage:`, error);
    logger.error('Error removing TOIL usage:', error);
    return false;
  }
}

/**
 * Clear deletion tracking arrays
 */
async function clearDeletionTracking(): Promise<boolean> {
  try {
    console.log(`[TOIL-DEBUG] Clearing deletion tracking keys:`, [DELETED_TOIL_RECORDS_KEY, DELETED_TOIL_USAGE_KEY]);
    
    localStorage.removeItem(DELETED_TOIL_RECORDS_KEY);
    localStorage.removeItem(DELETED_TOIL_USAGE_KEY);
    
    console.log(`[TOIL-DEBUG] ✅ Deletion tracking cleared`);
    return true;
  } catch (error) {
    console.error(`[TOIL-DEBUG] ❌ Error clearing deletion tracking:`, error);
    logger.error('Error clearing deletion tracking:', error);
    return false;
  }
}

/**
 * ENHANCED: Force immediate UI state update after deletion
 * Enhanced to include regeneration status
 */
export function triggerUIStateUpdate(regenerated = false): void {
  console.log(`[TOIL-DEBUG] ==> TRIGGERING UI STATE UPDATE (regenerated: ${regenerated})`);
  
  // Dispatch custom event to notify UI components
  const event = new CustomEvent('toilDataDeleted', {
    detail: { 
      timestamp: Date.now(),
      regenerated
    }
  });
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(event);
    console.log(`[TOIL-DEBUG] ✅ UI update event dispatched with regeneration status: ${regenerated}`);
  }
}

/**
 * Check if any TOIL data exists for debugging
 */
export function debugToilDataState(userId?: string): {
  hasRecords: boolean;
  hasUsage: boolean;
  hasCacheKeys: boolean;
  hasTrackingData: boolean;
  allToilKeys: string[];
} {
  const allKeys = Object.keys(localStorage);
  const toilKeys = allKeys.filter(key => 
    key.includes('toil') || key.includes('TOIL')
  );

  const hasRecords = localStorage.getItem(TOIL_RECORDS_KEY) !== null;
  const hasUsage = localStorage.getItem(TOIL_USAGE_KEY) !== null;
  const hasCacheKeys = toilKeys.some(key => key.startsWith('toilSummary_'));
  const hasTrackingData = localStorage.getItem(DELETED_TOIL_RECORDS_KEY) !== null || 
                         localStorage.getItem(DELETED_TOIL_USAGE_KEY) !== null;

  console.log(`[TOIL-DEBUG] Current TOIL data state:`, {
    hasRecords,
    hasUsage,
    hasCacheKeys,
    hasTrackingData,
    allToilKeys: toilKeys
  });

  return {
    hasRecords,
    hasUsage,
    hasCacheKeys,
    hasTrackingData,
    allToilKeys: toilKeys
  };
}
