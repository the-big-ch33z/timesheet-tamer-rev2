import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_SUMMARY_CACHE_KEY } from './constants';
import { 
  loadTOILRecords, 
  loadTOILUsage, 
  filterRecordsByDate,
  filterRecordsByMonth,
  getSummaryCacheKey,
  safelyParseJSON
} from './core';
import { TOILSummary } from '@/types/toil';

const logger = createTimeLogger('TOILStorageQueries');

// Export TOILDayInfo interface
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

// Get all TOIL records for a specific user
export const getUserTOILRecords = (userId: string) => {
  return loadTOILRecords(userId);
};

/**
 * Find TOIL records associated with a specific time entry
 */
export const findTOILRecordsByEntryId = (entryId: string) => {
  try {
    const allRecords = loadTOILRecords();
    const entryRecords = allRecords.filter(record => record.entryId === entryId);
    
    logger.debug(`Found ${entryRecords.length} TOIL records for entry ${entryId}`);
    return entryRecords;
  } catch (error) {
    logger.error(`Error getting TOIL records for entry ${entryId}:`, error);
    return [];
  }
};

/**
 * Delete TOIL records associated with a specific time entry
 * @deprecated Use deleteTOILRecordsByEntryId from record-management.ts instead
 */
export const deleteTOILRecordByEntryId = async (entryId: string): Promise<boolean> => {
  // Import dynamically to avoid circular dependencies
  const { deleteTOILRecordsByEntryId } = await import('./record-management');
  return deleteTOILRecordsByEntryId(entryId);
};

/**
 * Get a summary of TOIL for a specific user and date or month
 * @param userId User ID
 * @param dateOrMonth Date object or string in 'yyyy-MM' format
 * @returns TOILSummary object or null if not found
 */
export const getTOILSummary = (userId: string, dateOrMonth: Date | string): TOILSummary => {
  // Normalize to yyyy-MM format
  const monthYear = typeof dateOrMonth === 'string' 
    ? dateOrMonth.includes('-') ? dateOrMonth.substring(0, 7) : dateOrMonth
    : format(dateOrMonth, 'yyyy-MM');
  
  const cacheKey = getSummaryCacheKey(userId, monthYear);
  
  try {
    const cachedSummary = localStorage.getItem(cacheKey);
    
    // If we have a cached summary, return it
    if (cachedSummary) {
      logger.debug(`Returning cached TOIL summary for ${userId} on ${monthYear}`);
      return safelyParseJSON<TOILSummary>(cachedSummary, {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      });
    }
    
    // Otherwise, calculate summary from records
    const records = loadTOILRecords(userId);
    const monthRecords = filterRecordsByMonth(records, monthYear);
    
    const usages = loadTOILUsage(userId);
    const monthUsages = filterRecordsByMonth(usages, monthYear);
    
    // Calculate totals
    const accrued = monthRecords.reduce((sum, record) => sum + (record.hours || 0), 0);
    const used = monthUsages.reduce((sum, usage) => sum + (usage.hours || 0), 0);
    const remaining = Math.max(0, accrued - used);
    
    // Create summary object
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the calculated summary
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    logger.debug(`No cached TOIL summary found for ${userId} on ${monthYear}, calculated new one`);
    return summary;
  } catch (error) {
    logger.error(`Error getting TOIL summary for ${userId} on ${monthYear}:`, error);
    
    // Return empty summary on error
    return {
      userId,
      monthYear,
      accrued: 0,
      used: 0,
      remaining: 0
    };
  }
};

/**
 * Check if a user has any TOIL records for a specific day
 */
export const hasTOILForDay = (userId: string, date: Date): TOILDayInfo => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Get records for this user
    const records = loadTOILRecords(userId);
    const usages = loadTOILUsage(userId);
    
    // Filter records for this day
    const dayRecords = filterRecordsByDate(records, date);
    const dayUsages = filterRecordsByDate(usages, date);
    
    // Calculate total TOIL hours for day
    const toilHours = dayRecords.reduce((sum, record) => sum + (record.hours || 0), 0);
    
    return { 
      hasAccrued: dayRecords.length > 0, 
      hasUsed: dayUsages.length > 0, 
      toilHours 
    };
  } catch (error) {
    logger.error(`Error checking TOIL for day ${date} and user ${userId}:`, error);
    return { hasAccrued: false, hasUsed: false, toilHours: 0 };
  }
};

/**
 * Check if a user has any TOIL records for a specific month
 */
export const hasTOILForMonth = (userId: string, date: Date): boolean => {
  try {
    const monthYear = format(date, 'yyyy-MM');
    const summary = getTOILSummary(userId, monthYear);
    return summary ? (summary.accrued > 0 || summary.used > 0) : false;
  } catch (error) {
    logger.error(`Error checking TOIL for month ${date} and user ${userId}:`, error);
    return false;
  }
};
