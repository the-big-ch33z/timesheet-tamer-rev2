import { TOILUsage } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_USAGE_KEY, STORAGE_RETRY_DELAY, STORAGE_MAX_RETRIES } from "./constants";
import { attemptStorageOperation, loadTOILUsage } from "./core";

const logger = createTimeLogger('TOIL-Storage-UsageOperations');

/**
 * Store a TOIL usage record in local storage
 * 
 * @param usage - The TOIL usage record to store
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    const usages = loadTOILUsage();
    
    // Remove any existing usages with the same ID (update case)
    const filteredUsages = usages.filter(u => u.id !== usage.id);
    
    // Add the new/updated usage
    filteredUsages.push(usage);
    
    // Store the updated usages array
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsages)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`TOIL usage successfully stored: ${usage.id}`);
    return true;
  } catch (error) {
    logger.error(`Error storing TOIL usage: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Clean up duplicate TOIL usage records
 * 
 * @param userId User ID to clean up records for
 * @returns Number of records removed
 */
export async function cleanupDuplicateTOILUsage(userId: string): Promise<number> {
  try {
    const allUsage = loadTOILUsage();
    const originalCount = allUsage.length;
    
    if (originalCount === 0) {
      logger.debug('No TOIL usage records found, nothing to clean up');
      return 0;
    }
    
    // Group records by entry ID (unique identifier from the time entry)
    const usageByEntryId = new Map<string, TOILUsage[]>();
    
    for (const usage of allUsage) {
      if (usage.userId !== userId) continue; // Only process records for specified user
      
      if (!usage.entryId) {
        logger.warn(`TOIL usage record ${usage.id} has no entry ID, skipping`);
        continue;
      }
      
      const group = usageByEntryId.get(usage.entryId) || [];
      group.push(usage);
      usageByEntryId.set(usage.entryId, group);
    }
    
    // Consolidate duplicate usage records
    const consolidatedUsage: TOILUsage[] = [];
    
    // Add all non-user records first
    consolidatedUsage.push(...allUsage.filter(u => u.userId !== userId));
    
    // Now process duplicates for the specified user
    for (const [entryId, usages] of usageByEntryId.entries()) {
      if (usages.length === 1) {
        // No duplicates, keep as is
        consolidatedUsage.push(usages[0]);
        continue;
      }
      
      // Sort by most recent first
      usages.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Keep only the most recent usage for this entry ID
      const mostRecent = usages[0];
      logger.debug(`Found ${usages.length} duplicate usages for entry ${entryId}, keeping most recent`);
      
      consolidatedUsage.push(mostRecent);
    }
    
    // Save consolidated usage
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(consolidatedUsage)),
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    const removed = originalCount - consolidatedUsage.length;
    logger.debug(`Removed ${removed} duplicate TOIL usage records, ${consolidatedUsage.length} records remaining`);
    
    return removed;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL usage: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}
