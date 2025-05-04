
import { TOILRecord, TOILUsage } from "@/types/toil";
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from './constants';

const logger = createTimeLogger('TOILStorageCore');

// Clear the summary cache for a specific user and month
export function clearSummaryCache(userId: string, monthYear?: string): void {
  try {
    const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}${monthYear ? `-${monthYear}` : ''}`;
    logger.debug(`Clearing summary cache for key: ${cacheKey}`);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    logger.error('Error clearing summary cache:', error);
  }
}

// Clear all TOIL caches for all users
export function clearAllTOILCaches(): void {
  try {
    // Find and remove all TOIL summary cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    }
    
    logger.debug('All TOIL caches cleared');
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
  }
}
