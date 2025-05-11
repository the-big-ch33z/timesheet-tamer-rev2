
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from "./constants";
import { createTimeLogger } from "../../../errors/timeLogger";

const logger = createTimeLogger('toil-storage-core');

/**
 * Clear summary cache for a specific user and month
 */
export const clearSummaryCache = (userId: string, monthYear?: string): boolean => {
  try {
    if (monthYear) {
      // Clear specific month
      localStorage.removeItem(`${TOIL_SUMMARY_CACHE_KEY}_${userId}_${monthYear}`);
    } else {
      // Clear all months for this user
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${TOIL_SUMMARY_CACHE_KEY}_${userId}`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL summary cache for ${userId}:`, error);
    return false;
  }
};

/**
 * Clear all TOIL caches
 */
export const clearAllTOILCaches = (): boolean => {
  try {
    // Find all TOIL-related keys and remove them
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith(TOIL_RECORDS_KEY) || 
        key.startsWith(TOIL_USAGE_KEY) || 
        key.startsWith(TOIL_SUMMARY_CACHE_KEY)
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
    return false;
  }
};

/**
 * Clear TOIL cache for a specific user
 */
export const clearTOILCache = (userId: string): boolean => {
  try {
    // Clear user-specific caches
    clearSummaryCache(userId);
    
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL cache for user ${userId}:`, error);
    return false;
  }
};
