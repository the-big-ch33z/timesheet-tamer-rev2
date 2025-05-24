import { TOILUsage } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_USAGE_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';
import { attemptStorageOperation, loadRawTOILUsage } from './core';
import { addToDeletedTOILUsage } from './deletion-tracking';
import { deleteAllToilData } from '../unifiedDeletion';

const logger = createTimeLogger('TOIL-UsageOperations');

/**
 * Store a TOIL usage record
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    logger.debug(`Storing TOIL usage: ${usage.id}`);
    
    // Load existing usage
    const existingUsage = loadRawTOILUsage();
    
    // Check if this usage already exists
    const existingIndex = existingUsage.findIndex(u => u.id === usage.id);
    
    if (existingIndex >= 0) {
      // Update existing usage
      existingUsage[existingIndex] = usage;
    } else {
      // Add new usage
      existingUsage.push(usage);
    }
    
    // Save back to storage
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(existingUsage)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`TOIL usage stored successfully: ${usage.id}`);
    return true;
  } catch (error) {
    logger.error(`Error storing TOIL usage ${usage.id}:`, error);
    return false;
  }
}

/**
 * Clean up duplicate TOIL usage records
 */
export async function cleanupDuplicateTOILUsage(userId: string): Promise<number> {
  try {
    logger.debug(`Cleaning up duplicate TOIL usage for user ${userId}`);
    
    // Load all usage
    const allUsage = loadRawTOILUsage();
    
    // Filter for this user
    const userUsage = allUsage.filter(usage => usage.userId === userId);
    
    // Track seen dates to identify duplicates
    const seenDates = new Map<string, TOILUsage>();
    const duplicates: TOILUsage[] = [];
    
    // Find duplicates (same date and entryId)
    userUsage.forEach(usage => {
      const key = `${usage.date.toString()}-${usage.entryId}`;
      
      if (seenDates.has(key)) {
        // Keep the one with the most recent timestamp or ID if timestamps are equal
        const existing = seenDates.get(key)!;
        
        if (usage.timestamp > existing.timestamp || 
            (usage.timestamp === existing.timestamp && usage.id > existing.id)) {
          duplicates.push(existing);
          seenDates.set(key, usage);
        } else {
          duplicates.push(usage);
        }
      } else {
        seenDates.set(key, usage);
      }
    });
    
    if (duplicates.length === 0) {
      logger.debug(`No duplicate TOIL usage found for user ${userId}`);
      return 0;
    }
    
    logger.debug(`Found ${duplicates.length} duplicate TOIL usage records for user ${userId}`);
    
    // Remove duplicates
    const duplicateIds = duplicates.map(d => d.id);
    const cleanedUsage = allUsage.filter(usage => !duplicateIds.includes(usage.id));
    
    // Save back to storage
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(cleanedUsage)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Removed ${duplicates.length} duplicate TOIL usage records for user ${userId}`);
    return duplicates.length;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL usage for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Delete TOIL usage by entry ID - now uses unified deletion approach
 */
export async function deleteTOILUsageByEntryId(entryId: string): Promise<number> {
  try {
    logger.debug(`Deleting TOIL usage for entry ID: ${entryId}`);
    
    // First, find which usage records would be affected
    const allUsage = loadRawTOILUsage();
    const usageToDelete = allUsage.filter(usage => usage.entryId === entryId);
    
    if (usageToDelete.length === 0) {
      logger.debug(`No TOIL usage found for entry ID: ${entryId}`);
      return 0;
    }
    
    // Get the userId from the first usage record for targeted deletion
    const userId = usageToDelete[0].userId;
    
    console.log(`[TOIL-DEBUG] Found ${usageToDelete.length} TOIL usage records for entry ${entryId}, user ${userId}`);
    
    // Add to deletion tracking first
    const trackingPromises = usageToDelete.map(usage => addToDeletedTOILUsage(usage.id));
    await Promise.all(trackingPromises);
    
    // Use unified deletion to clear user's TOIL data
    const deletionResult = await deleteAllToilData(userId);
    
    if (deletionResult.success) {
      logger.debug(`Successfully deleted ${usageToDelete.length} TOIL usage records for entry ${entryId} via unified deletion`);
      return usageToDelete.length;
    } else {
      logger.error(`Failed to delete TOIL usage for entry ${entryId} via unified deletion:`, deletionResult.errors);
      
      // Fallback to manual deletion
      const remainingUsage = allUsage.filter(usage => usage.entryId !== entryId);
      await attemptStorageOperation(
        () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(remainingUsage)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      logger.debug(`Fallback deletion completed for ${usageToDelete.length} TOIL usage records`);
      return usageToDelete.length;
    }
  } catch (error) {
    logger.error(`Error deleting TOIL usage for entry ${entryId}:`, error);
    return 0;
  }
}
