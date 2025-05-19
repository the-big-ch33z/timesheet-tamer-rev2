
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { TOILRecord, TOILUsage, TOILSummary } from '@/types/toil';
import { attemptStorageOperation } from './utils';
import {
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_SUMMARY_PREFIX
} from './constants';
import { createTimeLogger } from "@/utils/time/errors";

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
 * Load TOIL records for a user
 */
export function loadTOILRecords(userId: string): TOILRecord[] {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!records) {
      return [];
    }
    
    const allRecords: TOILRecord[] = safelyParseJSON(records, []);
    return allRecords.filter(record => record.userId === userId);
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load TOIL usage records for a user
 */
export function loadTOILUsage(userId: string): TOILUsage[] {
  try {
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!usage) {
      return [];
    }
    
    const allUsage: TOILUsage[] = safelyParseJSON(usage, []);
    return allUsage.filter(item => item.userId === userId);
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
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
export function clearSummaryCache(userId: string, monthYear: string): void {
  try {
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    localStorage.removeItem(cacheKey);
    logger.debug(`Cleared summary cache for ${userId} in ${monthYear}`);
  } catch (error) {
    logger.error('Error clearing summary cache:', error);
  }
}

/**
 * Clear all TOIL caches
 */
export function clearAllTOILCaches(): void {
  try {
    // Get all localStorage keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TOIL_SUMMARY_PREFIX)) {
        keys.push(key);
      }
    }
    
    // Remove all TOIL cache keys
    keys.forEach(key => localStorage.removeItem(key));
    
    logger.debug(`Cleared ${keys.length} TOIL cache entries`);
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
  }
}

/**
 * Get TOIL summary for a specific month
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
  try {
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return safelyParseJSON(cached, null);
    }
    
    // If no cached summary, calculate from records
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
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
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    return summary;
  } catch (error) {
    logger.error('Error getting TOIL summary:', error);
    return null;
  }
}

/**
 * Filter TOIL records by date range
 */
export function filterRecordsByDate(records: TOILRecord[], startDate: Date, endDate: Date): TOILRecord[] {
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
