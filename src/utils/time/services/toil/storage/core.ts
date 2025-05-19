
import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_PREFIX } from "./constants";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOIL-Storage-Core');

/**
 * Safely parse JSON data with fallback to default value
 */
export function safelyParseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Attempt a storage operation with retries
 * 
 * @param operation Function that performs the storage operation
 * @param delay Delay between retries in ms (default: 200)
 * @param maxRetries Maximum number of retries (default: 3)
 * @returns Promise that resolves when operation succeeds or fails
 */
export async function attemptStorageOperation(
  operation: () => void,
  delay = 200,
  maxRetries = 3
): Promise<void> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      operation();
      return;
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        logger.error(`Storage operation failed after ${maxRetries} retries:`, error);
        throw error;
      }
      logger.warn(`Storage operation failed, retry ${retries}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Load all TOIL records from storage
 * 
 * @returns Array of TOIL records
 */
export function loadTOILRecords(): TOILRecord[] {
  const rawRecords = localStorage.getItem(TOIL_RECORDS_KEY);
  return safelyParseJSON<TOILRecord[]>(rawRecords, []);
}

/**
 * Load all TOIL usage records from storage
 * 
 * @returns Array of TOIL usage records
 */
export function loadTOILUsage(): TOILUsage[] {
  const rawUsage = localStorage.getItem(TOIL_USAGE_KEY);
  return safelyParseJSON<TOILUsage[]>(rawUsage, []);
}

/**
 * Get the cache key for a TOIL summary
 * 
 * @param userId User ID
 * @param monthYear Month-year string (YYYY-MM)
 * @returns Cache key for the summary
 */
export function getSummaryCacheKey(userId: string, monthYear: string): string {
  return `${TOIL_SUMMARY_PREFIX}_${userId}_${monthYear}`;
}

/**
 * Clear the TOIL summary cache for a specific user and month
 * 
 * @param userId User ID
 * @param monthYear Month-year string (YYYY-MM)
 */
export function clearSummaryCache(userId: string, monthYear: string): void {
  const cacheKey = getSummaryCacheKey(userId, monthYear);
  localStorage.removeItem(cacheKey);
  logger.debug(`Cleared TOIL summary cache for ${userId} - ${monthYear}`);
}

/**
 * Clear all TOIL caches (summary, records, usage)
 * This is an expensive operation and should be used sparingly
 */
export function clearAllTOILCaches(): void {
  // Clear all summary caches (keys starting with TOIL_SUMMARY_PREFIX)
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(TOIL_SUMMARY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove collected keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  logger.debug(`Cleared ${keysToRemove.length} TOIL summary caches`);
}
