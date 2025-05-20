
/**
 * @deprecated This file is kept for backward compatibility.
 * Import utilities from './core.ts' instead.
 */

// Define the attemptStorageOperation function directly here
export const attemptStorageOperation = async <T>(
  operation: () => T,
  retryDelay: number = 200,
  maxRetries: number = 3
): Promise<T> => {
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= maxRetries) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};

// Export constants for backward compatibility
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;

// Keep track of TOILDayInfo cache for immediate clearing
const toilDayInfoCache = new Map<string, any>();

// Helper function for safely parsing JSON
export const safelyParseJSON = (json: string | null, defaultValue: any) => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

// Function to clear the TOILDayInfo cache when a TOIL calculation happens
export const clearTOILDayInfoCache = (userId?: string, date?: Date) => {
  if (userId && date) {
    // Clear specific user+date entry
    const dateKey = date.toISOString().split('T')[0];
    const cacheKey = `toil-day-info-${userId}-${dateKey}`;
    toilDayInfoCache.delete(cacheKey);
  } else if (userId) {
    // Clear all entries for this user
    const keysToDelete: string[] = [];
    toilDayInfoCache.forEach((_, key) => {
      if (key.startsWith(`toil-day-info-${userId}`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => toilDayInfoCache.delete(key));
  } else {
    // Clear all cache
    toilDayInfoCache.clear();
  }
};

// Add a function to get cached TOILDayInfo with automatic clearing
export const getCachedTOILDayInfo = (userId: string, date: Date, finder: () => any): any => {
  const dateKey = date.toISOString().split('T')[0];
  const cacheKey = `toil-day-info-${userId}-${dateKey}`;
  
  if (toilDayInfoCache.has(cacheKey)) {
    return toilDayInfoCache.get(cacheKey);
  }
  
  const result = finder();
  toilDayInfoCache.set(cacheKey, result);
  return result;
};

// Export toilDayInfoCache but remove duplicate exports of functions
export { toilDayInfoCache };

