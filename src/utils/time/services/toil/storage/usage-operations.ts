
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
