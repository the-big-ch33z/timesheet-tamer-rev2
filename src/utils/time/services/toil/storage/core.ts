
import { TOILRecord, TOILUsage } from "@/types/toil";
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILStorageCore');

// Storage keys
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export const TOIL_SUMMARY_CACHE_KEY = 'toilSummaryCache';

// Load TOIL records from storage
export function loadTOILRecords(): TOILRecord[] {
  try {
    const stored = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    
    // Ensure dates are properly parsed from storage
    return Array.isArray(parsed) ? parsed.map(record => ({
      ...record,
      date: new Date(record.date)
    })) : [];
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

// Load TOIL usage from storage
export function loadTOILUsage(): TOILUsage[] {
  try {
    const stored = localStorage.getItem(TOIL_USAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // Ensure dates are properly parsed from storage
    return Array.isArray(parsed) ? parsed.map(usage => ({
      ...usage,
      date: new Date(usage.date)
    })) : [];
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

// Clear the summary cache for a specific user and month
export function clearSummaryCache(userId: string, monthYear?: string): void {
  try {
    const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}${monthYear ? `-${monthYear}` : ''}`;
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
