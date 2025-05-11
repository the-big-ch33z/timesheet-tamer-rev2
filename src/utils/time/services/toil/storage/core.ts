
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_SUMMARY_CACHE_KEY } from './constants';
import { attemptStorageOperation } from './utils';

const logger = createTimeLogger('TOILStorageCore');

/**
 * Clear TOIL summary cache
 * @param userId Optional user ID to clear cache for specific user
 * @param monthYear Optional month year to clear cache for specific month
 */
export const clearSummaryCache = async (userId?: string, monthYear?: string): Promise<boolean> => {
  return attemptStorageOperation(async () => {
    logger.debug('Clearing TOIL summary cache');
    
    // Find all cache keys that start with the summary prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
        // Filter by userId and monthYear if provided
        if (userId && !key.includes(userId)) {
          continue;
        }
        
        if (monthYear && !key.includes(monthYear)) {
          continue;
        }
        
        keysToRemove.push(key);
      }
    }
    
    // Remove all identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      logger.debug(`Removed TOIL cache key: ${key}`);
    });
    
    logger.debug(`Cleared ${keysToRemove.length} TOIL summary cache entries`);
    return true;
  }, 'clearSummaryCache');
};

/**
 * Clear all TOIL-related caches
 */
export const clearAllTOILCaches = async (): Promise<boolean> => {
  await clearSummaryCache();
  logger.debug('Cleared all TOIL caches');
  return true;
};
