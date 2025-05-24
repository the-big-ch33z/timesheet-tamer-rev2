
import { createTimeLogger } from "@/utils/time/errors";
import { attemptStorageOperation } from "./utils";
import { STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from "./constants";

const logger = createTimeLogger('TOIL-DeletionTracking');

// Storage keys for tracking deleted TOIL data
export const DELETED_TOIL_RECORDS_KEY = 'toil-records-deleted';
export const DELETED_TOIL_USAGE_KEY = 'toil-usage-deleted';

/**
 * Load list of deleted TOIL record IDs
 */
export function loadDeletedTOILRecords(): string[] {
  try {
    const deletedIds = localStorage.getItem(DELETED_TOIL_RECORDS_KEY);
    if (!deletedIds) return [];
    
    const parsed = JSON.parse(deletedIds);
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
  } catch (error) {
    logger.error('Error loading deleted TOIL records:', error);
    return [];
  }
}

/**
 * Load list of deleted TOIL usage IDs
 */
export function loadDeletedTOILUsage(): string[] {
  try {
    const deletedIds = localStorage.getItem(DELETED_TOIL_USAGE_KEY);
    if (!deletedIds) return [];
    
    const parsed = JSON.parse(deletedIds);
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
  } catch (error) {
    logger.error('Error loading deleted TOIL usage:', error);
    return [];
  }
}

/**
 * Add TOIL record ID to deletion tracking
 */
export async function addToDeletedTOILRecords(recordId: string): Promise<boolean> {
  try {
    const deletedIds = loadDeletedTOILRecords();
    
    if (!deletedIds.includes(recordId)) {
      deletedIds.push(recordId);
      
      await attemptStorageOperation(
        () => localStorage.setItem(DELETED_TOIL_RECORDS_KEY, JSON.stringify(deletedIds)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      logger.debug(`Added TOIL record ${recordId} to deletion tracking`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error adding TOIL record ${recordId} to deletion tracking:`, error);
    return false;
  }
}

/**
 * Add TOIL usage ID to deletion tracking
 */
export async function addToDeletedTOILUsage(usageId: string): Promise<boolean> {
  try {
    const deletedIds = loadDeletedTOILUsage();
    
    if (!deletedIds.includes(usageId)) {
      deletedIds.push(usageId);
      
      await attemptStorageOperation(
        () => localStorage.setItem(DELETED_TOIL_USAGE_KEY, JSON.stringify(deletedIds)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      logger.debug(`Added TOIL usage ${usageId} to deletion tracking`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error adding TOIL usage ${usageId} to deletion tracking:`, error);
    return false;
  }
}

/**
 * Check if a TOIL record is marked as deleted
 */
export function isTOILRecordDeleted(recordId: string): boolean {
  const deletedIds = loadDeletedTOILRecords();
  return deletedIds.includes(recordId);
}

/**
 * Check if a TOIL usage is marked as deleted
 */
export function isTOILUsageDeleted(usageId: string): boolean {
  const deletedIds = loadDeletedTOILUsage();
  return deletedIds.includes(usageId);
}

/**
 * Clear all deletion tracking (use with caution)
 */
export async function clearAllTOILDeletionTracking(): Promise<void> {
  try {
    await attemptStorageOperation(
      () => {
        localStorage.removeItem(DELETED_TOIL_RECORDS_KEY);
        localStorage.removeItem(DELETED_TOIL_USAGE_KEY);
      },
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug('Cleared all TOIL deletion tracking');
  } catch (error) {
    logger.error('Error clearing TOIL deletion tracking:', error);
  }
}
