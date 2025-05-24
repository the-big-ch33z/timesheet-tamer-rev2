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

export function safelyParseJSON<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

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

export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;

const toilDayInfoCache = new Map<string, any>();

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

export function loadTOILRecords(userId?: string): TOILRecord[] {
  try {
    const allRecords = loadRawTOILRecords();
    const deletedRecordIds = loadDeletedTOILRecords();
    
    let filteredRecords = allRecords.filter(record => !deletedRecordIds.includes(record.id));
    
    if (userId) {
      filteredRecords = filteredRecords.filter(record => record.userId === userId);
    }
    
    return filteredRecords;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

export function loadTOILUsage(userId?: string): TOILUsage[] {
  try {
    const allUsage = loadRawTOILUsage();
    const deletedUsageIds = loadDeletedTOILUsage();
    
    let filteredUsage = allUsage.filter(item => !deletedUsageIds.includes(item.id));
    
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
 * @deprecated Use deleteAllToilData() from unifiedDeletion.ts instead
 */
export async function checkAndFixStorageConsistency(): Promise<{ recordsFixed: number; usageFixed: number }> {
  console.warn('[TOIL-DEBUG] ⚠️ checkAndFixStorageConsistency is deprecated, using unified deletion instead');
  
  const result = await deleteAllToilData();
  
  return {
    recordsFixed: result.summary.recordsRemoved ? 1 : 0,
    usageFixed: result.summary.usageRemoved ? 1 : 0
  };
}

export function getSummaryCacheKey(userId: string, monthYear: string): string {
  return `${TOIL_SUMMARY_PREFIX}_${userId}_${monthYear}`;
}

/**
 * UPDATED: Clear TOIL summary cache now uses unified deletion for consistency
 */
export async function clearSummaryCache(userId?: string, monthYear?: string): Promise<void> {
  console.log(`[TOIL-DEBUG] ==> CLEARING SUMMARY CACHE (routed to unified deletion)`);
  
  if (userId && monthYear) {
    // For specific cache clearing, still use direct removal but log for tracking
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    localStorage.removeItem(cacheKey);
    console.log(`[TOIL-DEBUG] ✅ Cleared specific cache key: ${cacheKey}`);
  } else {
    // For global cache clearing, use unified deletion
    console.log(`[TOIL-DEBUG] Using unified deletion for global cache clearing`);
    const result = await deleteAllToilData();
    console.log(`[TOIL-DEBUG] ✅ Global cache clearing via unified deletion:`, result.summary);
  }
  
  toilDayInfoCache.clear();
}

/**
 * UPDATED: Clear all TOIL caches now uses unified deletion
 */
export async function clearAllTOILCaches(): Promise<void> {
  console.log(`[TOIL-DEBUG] ==> CLEAR ALL TOIL CACHES (routed to unified deletion)`);
  
  // Use unified deletion for complete cache clearing
  const result = await deleteAllToilData();
  console.log(`[TOIL-DEBUG] ✅ All caches cleared via unified deletion:`, result);
}

export function getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
  try {
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const parsedSummary = safelyParseJSON(cached, null);
      
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
    
    logger.debug(`No valid cache found for ${userId} in ${monthYear}. Calculating...`);
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
    const accrued = records
      .filter(record => record.monthYear === monthYear)
      .reduce((sum, record) => sum + record.hours, 0);
    
    const used = usage
      .filter(usage => usage.monthYear === monthYear)
      .reduce((sum, usage) => sum + usage.hours, 0);
    
    const remaining = accrued - used;
    
    const summary: TOILSummary = { 
      userId, 
      monthYear, 
      accrued, 
      used, 
      remaining 
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(summary));
    } catch (error) {
      logger.warn('Could not cache TOIL summary:', error);
    }
    
    return summary;
  } catch (error) {
    logger.error('Error getting TOIL summary:', error);
    return null;
  }
}

export function filterRecordsByDate(records: TOILRecord[], date: Date): TOILRecord[] {
  const targetDate = format(date, 'yyyy-MM-dd');
  return records.filter(record => {
    const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
    return recordDate === targetDate;
  });
}

export function filterRecordsByEntryId(records: TOILRecord[], entryId: string): TOILRecord[] {
  return records.filter(record => record.entryId === entryId);
}
