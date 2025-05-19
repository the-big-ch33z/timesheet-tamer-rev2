import { createTimeLogger } from '@/utils/time/errors';
import { TOILRecord, TOILUsage, TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY, 
  TOIL_SUMMARY_CACHE_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';

const logger = createTimeLogger('TOILStorageCore');

// ================ Base Storage Operations ================

/**
 * Helper to safely parse JSON from storage
 */
export function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Helper to perform storage operations with retry logic
 * This prevents race conditions and storage errors
 */
export async function attemptStorageOperation<T>(
  operation: () => Promise<T> | T, 
  retryDelay: number = STORAGE_RETRY_DELAY,
  maxRetries: number = STORAGE_MAX_RETRIES
): Promise<T> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      logger.debug(`Attempting storage operation (try ${retryCount + 1}/${maxRetries})`);
      const result = await operation();
      logger.debug('Storage operation successful');
      return result;
    } catch (error) {
      retryCount++;
      logger.error(`Error in storage operation (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        logger.error('Max retries reached for operation');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      logger.debug('Retrying operation');
    }
  }
  
  // This should never be reached due to the throw in the catch block,
  // but TypeScript requires a return statement
  throw new Error('Failed to complete storage operation');
}

// ================ Core Data Loading Operations ================

/**
 * Load all TOIL records from storage
 * @param filterUserId Optional user ID to filter records
 * @returns Array of TOILRecord objects
 */
export function loadTOILRecords(filterUserId?: string): TOILRecord[] {
  try {
    logger.debug(`Loading TOIL records${filterUserId ? ` for user: ${filterUserId}` : ''}`);
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!records) {
      return [];
    }
    
    const allRecords = safelyParseJSON<TOILRecord[]>(records, []);
    
    if (filterUserId) {
      return allRecords.filter(record => record.userId === filterUserId);
    }
    
    return allRecords;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load all TOIL usage records from storage
 * @param filterUserId Optional user ID to filter records
 * @returns Array of TOILUsage objects
 */
export function loadTOILUsage(filterUserId?: string): TOILUsage[] {
  try {
    logger.debug(`Loading TOIL usage${filterUserId ? ` for user: ${filterUserId}` : ''}`);
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!usage) {
      return [];
    }
    
    const allUsage = safelyParseJSON<TOILUsage[]>(usage, []);
    
    if (filterUserId) {
      return allUsage.filter(record => record.userId === filterUserId);
    }
    
    return allUsage;
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Filter records by entry ID
 */
export function filterRecordsByEntryId(records: TOILRecord[], entryId: string): TOILRecord[] {
  return records.filter(record => record.entryId === entryId);
}

/**
 * Helper function to filter records by month
 * @param records Array of records with monthYear property
 * @param monthYear Month to filter by in format 'yyyy-MM'
 * @returns Filtered array of records
 */
export function filterRecordsByMonth<T extends { monthYear?: string }>(
  records: T[], 
  monthYear: string
): T[] {
  return records.filter(record => record.monthYear === monthYear);
}

/**
 * Helper function to filter records by date
 * @param records Array of records with date property
 * @param date Date to filter by
 * @returns Filtered array of records
 */
export function filterRecordsByDate<T extends { date: Date | string }>(
  records: T[], 
  date: Date
): T[] {
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  return records.filter(record => {
    const recordDate = record.date instanceof Date 
      ? format(record.date, 'yyyy-MM-dd')
      : format(new Date(record.date), 'yyyy-MM-dd');
    
    return recordDate === formattedDate;
  });
}

// ================ Cache Management ================

/**
 * Get summary cache key for a user and month
 */
export function getSummaryCacheKey(userId: string, monthYear: string): string {
  return `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
}

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
  });
};

/**
 * Clear all TOIL-related caches
 */
export const clearAllTOILCaches = async (): Promise<boolean> => {
  await clearSummaryCache();
  logger.debug('Cleared all TOIL caches');
  return true;
};
