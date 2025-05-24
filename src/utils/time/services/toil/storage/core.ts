import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { TOILRecord, TOILUsage, TOILSummary } from '@/types/toil';
import {
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_SUMMARY_PREFIX
} from './constants';
import { createTimeLogger } from "@/utils/time/errors";
import { loadDeletedTOILRecords, loadDeletedTOILUsage } from './deletion-tracking';
import { deleteAllToilData } from '../unifiedDeletion';

const logger = createTimeLogger('TOIL-Storage-Core');

/**
 * Safely parse JSON with error handling
 */
export function safelyParseJSON<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Attempt storage operation with retry logic
 */
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

// Export constants for storage operations
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;

// Keep track of TOILDayInfo cache for immediate clearing
const toilDayInfoCache = new Map<string, any>();

/**
 * Load raw TOIL records directly from storage without deletion filtering
 * This bypasses the deletion tracking system for physical storage operations
 */
export function loadRawTOILRecords(): TOILRecord[] {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!records) {
      return [];
    }
    
    const allRecords: TOILRecord[] = safelyParseJSON(records, []);
    return allRecords;
  } catch (error) {
    logger.error('Error loading raw TOIL records:', error);
    return [];
  }
}

/**
 * Load raw TOIL usage directly from storage without deletion filtering
 * This bypasses the deletion tracking system for physical storage operations
 */
export function loadRawTOILUsage(): TOILUsage[] {
  try {
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!usage) {
      return [];
    }
    
    const allUsage: TOILUsage[] = safelyParseJSON(usage, []);
    return allUsage;
  } catch (error) {
    logger.error('Error loading raw TOIL usage:', error);
    return [];
  }
}

/**
 * Load TOIL records for a user (now respects deletion tracking)
 */
export function loadTOILRecords(userId?: string): TOILRecord[] {
  try {
    const allRecords = loadRawTOILRecords();
    const deletedRecordIds = loadDeletedTOILRecords();
    
    // Filter out deleted records
    let filteredRecords = allRecords.filter(record => !deletedRecordIds.includes(record.id));
    
    // Filter by userId if provided
    if (userId) {
      filteredRecords = filteredRecords.filter(record => record.userId === userId);
    }
    
    return filteredRecords;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load TOIL usage records for a user (now respects deletion tracking)
 */
export function loadTOILUsage(userId?: string): TOILUsage[] {
  try {
    const allUsage = loadRawTOILUsage();
    const deletedUsageIds = loadDeletedTOILUsage();
    
    // Filter out deleted usage
    let filteredUsage = allUsage.filter(item => !deletedUsageIds.includes(item.id));
    
    // Filter by userId if provided
    if (userId) {
      filteredUsage = filteredUsage.filter(item => item.userId === userId);
    }
    
    return filteredUsage;
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Check and fix storage consistency between deletion tracking and actual storage
 * This function detects and repairs cases where records are marked as deleted but still exist in storage
 */
export async function checkAndFixStorageConsistency(): Promise<{ recordsFixed: number; usageFixed: number }> {
  try {
    logger.debug('Checking TOIL storage consistency...');
    
    const rawRecords = loadRawTOILRecords();
    const rawUsage = loadRawTOILUsage();
    const deletedRecordIds = loadDeletedTOILRecords();
    const deletedUsageIds = loadDeletedTOILUsage();
    
    // Find records that are marked as deleted but still exist in storage
    const inconsistentRecords = rawRecords.filter(record => deletedRecordIds.includes(record.id));
    const inconsistentUsage = rawUsage.filter(usage => deletedUsageIds.includes(usage.id));
    
    let recordsFixed = 0;
    let usageFixed = 0;
    
    // Physically remove inconsistent records
    if (inconsistentRecords.length > 0) {
      const cleanedRecords = rawRecords.filter(record => !deletedRecordIds.includes(record.id));
      await attemptStorageOperation(
        () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(cleanedRecords)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      recordsFixed = inconsistentRecords.length;
      logger.debug(`Fixed ${recordsFixed} inconsistent TOIL records`);
    }
    
    // Physically remove inconsistent usage
    if (inconsistentUsage.length > 0) {
      const cleanedUsage = rawUsage.filter(usage => !deletedUsageIds.includes(usage.id));
      await attemptStorageOperation(
        () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(cleanedUsage)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      usageFixed = inconsistentUsage.length;
      logger.debug(`Fixed ${usageFixed} inconsistent TOIL usage records`);
    }
    
    if (recordsFixed > 0 || usageFixed > 0) {
      logger.info(`Storage consistency check completed: fixed ${recordsFixed} records and ${usageFixed} usage items`);
      clearAllTOILCaches();
    } else {
      logger.debug('Storage consistency check: no issues found');
    }
    
    return { recordsFixed, usageFixed };
  } catch (error) {
    logger.error('Error during storage consistency check:', error);
    return { recordsFixed: 0, usageFixed: 0 };
  }
}

/**
 * Get cache key for TOIL summary
 */
export function getSummaryCacheKey(userId: string, monthYear: string): string {
  return `${TOIL_SUMMARY_PREFIX}_${userId}_${monthYear}`;
}

/**
 * Clear TOIL summary cache for a specific user and month
 */
export function clearSummaryCache(userId?: string, monthYear?: string): void {
  try {
    if (userId && monthYear) {
      // Clear specific cache
      const cacheKey = getSummaryCacheKey(userId, monthYear);
      localStorage.removeItem(cacheKey);
      logger.debug(`Cleared summary cache for ${userId} in ${monthYear}`);
    } else {
      // Clear all summary caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_PREFIX)) {
          localStorage.removeItem(key);
          logger.debug(`Cleared cache key: ${key}`);
        }
      }
      logger.debug('Cleared all summary caches');
    }
    
    // Also clear the in-memory cache
    toilDayInfoCache.clear();
  } catch (error) {
    logger.error('Error clearing summary cache:', error);
  }
}

/**
 * Clear all TOIL caches - now uses unified deletion
 */
export function clearAllTOILCaches(): void {
  try {
    // Use the unified deletion function for cache clearing only
    deleteAllToilData().then(result => {
      if (result.success) {
        logger.debug(`Cleared ${result.deletedCaches} TOIL cache entries via unified deletion`);
      } else {
        logger.error('Failed to clear TOIL caches via unified deletion:', result.errors);
      }
    }).catch(error => {
      logger.error('Error calling unified deletion for cache clearing:', error);
      // Fallback to manual clearing
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      toilDayInfoCache.clear();
      logger.debug(`Fallback: Cleared ${keys.length} TOIL cache entries manually`);
    });
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
  }
}

/**
 * Get TOIL summary for a specific month with improved caching
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
  try {
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    const cached = localStorage.getItem(cacheKey);
    
    // Aggressively check for cache validity
    if (cached) {
      const parsedSummary = safelyParseJSON(cached, null);
      
      // Validate the summary cache data
      if (parsedSummary && 
          typeof parsedSummary.accrued === 'number' && 
          typeof parsedSummary.used === 'number' && 
          typeof parsedSummary.remaining === 'number') {
        
        if (!isNaN(parsedSummary.accrued) && 
            !isNaN(parsedSummary.used) && 
            !isNaN(parsedSummary.remaining)) {
          logger.debug(`Using cached TOIL summary for ${userId} in ${monthYear}`);
          return parsedSummary;
        } else {
          logger.warn('Invalid cached summary data (NaN values). Recalculating...');
        }
      } else {
        logger.warn('Invalid cached summary structure. Recalculating...');
      }
    }
    
    // If cache is invalid or doesn't exist, calculate from records (now uses filtered data)
    logger.debug(`No valid cache found for ${userId} in ${monthYear}. Calculating...`);
    const records = loadTOILRecords(userId); // This now filters out deleted records
    const usage = loadTOILUsage(userId); // This now filters out deleted usage
    
    const accrued = records
      .filter(record => record.monthYear === monthYear)
      .reduce((sum, record) => sum + record.hours, 0);
    
    const used = usage
      .filter(usage => usage.monthYear === monthYear)
      .reduce((sum, usage) => sum + usage.hours, 0);
    
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining: accrued - used
    };
    
    // Cache the result with proper validation
    if (!isNaN(summary.accrued) && !isNaN(summary.used) && !isNaN(summary.remaining)) {
      localStorage.setItem(cacheKey, JSON.stringify(summary));
      logger.debug(`Cached new TOIL summary for ${userId} in ${monthYear}: A=${accrued}, U=${used}, R=${accrued-used}`);
    } else {
      logger.error(`Calculated invalid TOIL summary (NaN values): A=${accrued}, U=${used}, R=${accrued-used}`);
    }
    
    return summary;
  } catch (error) {
    logger.error('Error getting TOIL summary:', error);
    return null;
  }
}

/**
 * Filter TOIL records by date range
 */
export function filterRecordsByDate(records: TOILRecord[], startDate?: Date, endDate?: Date): TOILRecord[] {
  if (!startDate || !endDate) return records;
  
  return records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
}

/**
 * Filter TOIL records by entry ID
 */
export function filterRecordsByEntryId(records: TOILRecord[], entryId: string): TOILRecord[] {
  return records.filter(record => record.entryId === entryId);
}

/**
 * Function to clear the TOILDayInfo cache when a TOIL calculation happens
 */
export const clearTOILDayInfoCache = (userId?: string, date?: Date) => {
  if (userId && date) {
    // Clear specific user+date entry
    const dateKey = date.toISOString().split('T')[0];
    const cacheKey = `toil-day-info-${userId}-${dateKey}`;
    toilDayInfoCache.delete(cacheKey);
    logger.debug(`Cleared specific TOIL day info cache for ${userId} on ${dateKey}`);
  } else if (userId) {
    // Clear all entries for this user
    const keysToDelete: string[] = [];
    toilDayInfoCache.forEach((_, key) => {
      if (key.startsWith(`toil-day-info-${userId}`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => toilDayInfoCache.delete(key));
    logger.debug(`Cleared all TOIL day info caches for user ${userId}`);
  } else {
    // Clear all cache
    toilDayInfoCache.clear();
    logger.debug('Cleared all TOIL day info caches');
  }
};

/**
 * Get cached TOILDayInfo with automatic clearing
 */
export const getCachedTOILDayInfo = (userId: string, date: Date, finder: () => any): any => {
  const dateKey = date.toISOString().split('T')[0];
  const cacheKey = `toil-day-info-${userId}-${dateKey}`;
  
  if (toilDayInfoCache.has(cacheKey)) {
    logger.debug(`Using cached TOIL day info for ${userId} on ${dateKey}`);
    return toilDayInfoCache.get(cacheKey);
  }
  
  logger.debug(`No cached TOIL day info for ${userId} on ${dateKey}, calculating...`);
  const result = finder();
  toilDayInfoCache.set(cacheKey, result);
  return result;
};

// Export toilDayInfoCache
export { toilDayInfoCache };
