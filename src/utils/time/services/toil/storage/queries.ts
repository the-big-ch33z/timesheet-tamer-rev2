import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from './constants';
import { attemptStorageOperation, safelyParseJSON } from './utils';
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
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      logger.debug(`No TOIL records found for user ${userId}`);
      return [];
    }
    
    const allRecords = JSON.parse(records);
    const userRecords = allRecords.filter((record: any) => record.userId === userId);
    
    logger.debug(`Found ${userRecords.length} TOIL records for user ${userId}`);
    return userRecords;
  } catch (error) {
    logger.error(`Error getting TOIL records for user ${userId}:`, error);
    return [];
  }
};

/**
 * Find TOIL records associated with a specific time entry
 */
export const findTOILRecordsByEntryId = (entryId: string) => {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      logger.debug(`No TOIL records found for entry ${entryId}`);
      return [];
    }
    
    const allRecords = JSON.parse(records);
    const entryRecords = allRecords.filter((record: any) => record.entryId === entryId);
    
    logger.debug(`Found ${entryRecords.length} TOIL records for entry ${entryId}`);
    return entryRecords;
  } catch (error) {
    logger.error(`Error getting TOIL records for entry ${entryId}:`, error);
    return [];
  }
};

/**
 * Delete TOIL records associated with a specific time entry
 */
export const deleteTOILRecordByEntryId = async (entryId: string): Promise<boolean> => {
  return attemptStorageOperation(async () => {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      logger.debug(`No TOIL records found to delete for entry ${entryId}`);
      return true; // Consider it successful if there's nothing to delete
    }
    
    let allRecords = JSON.parse(records);
    const initialLength = allRecords.length;
    
    // Filter out records associated with the entryId
    allRecords = allRecords.filter((record: any) => record.entryId !== entryId);
    
    if (allRecords.length === initialLength) {
      logger.debug(`No TOIL records found to delete for entry ${entryId}`);
      return true; // Consider it successful if there's nothing to delete
    }
    
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(allRecords));
    
    logger.debug(`Deleted TOIL records for entry ${entryId}`);
    return true;
  }, `deleteTOILRecordByEntryId-${entryId}`);
};

/**
 * Get a summary of TOIL for a specific user and date or month
 * @param userId User ID
 * @param dateOrMonth Date object or string in 'yyyy-MM' format
 * @returns TOILSummary object or null if not found
 */
export const getTOILSummary = (userId: string, dateOrMonth: Date | string): TOILSummary | null => {
  // Normalize to yyyy-MM format
  const monthYear = typeof dateOrMonth === 'string' 
    ? dateOrMonth.includes('-') ? dateOrMonth.substring(0, 7) : dateOrMonth
    : format(dateOrMonth, 'yyyy-MM');
  
  const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
  
  try {
    const cachedSummary = localStorage.getItem(cacheKey);
    
    // If we have a cached summary, return it
    if (cachedSummary) {
      logger.debug(`Returning cached TOIL summary for ${userId} on ${monthYear}`);
      return JSON.parse(cachedSummary);
    }
    
    // Otherwise, calculate summary from records
    const records = getUserTOILRecords(userId);
    const monthRecords = records.filter((record: any) => record.monthYear === monthYear);
    
    const usages = localStorage.getItem(TOIL_USAGE_KEY);
    const allUsages = usages ? JSON.parse(usages) : [];
    const userUsages = allUsages.filter((usage: any) => usage.userId === userId);
    const monthUsages = userUsages.filter((usage: any) => usage.monthYear === monthYear);
    
    // Calculate totals
    const accrued = monthRecords.reduce((sum: number, record: any) => sum + (record.hours || 0), 0);
    const used = monthUsages.reduce((sum: number, usage: any) => sum + (usage.hours || 0), 0);
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
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      return { hasAccrued: false, hasUsed: false, toilHours: 0 };
    }
    
    const allRecords = JSON.parse(records);
    
    // Format the date for comparison
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Check accrued TOIL
    const accrued = allRecords.some(
      (record: any) => 
        record.userId === userId && 
        format(new Date(record.date), 'yyyy-MM-dd') === formattedDate
    );
    
    // Check for TOIL usage
    const usages = localStorage.getItem(TOIL_USAGE_KEY);
    const allUsages = usages ? JSON.parse(usages) : [];
    const used = allUsages.some(
      (usage: any) => 
        usage.userId === userId && 
        format(new Date(usage.date), 'yyyy-MM-dd') === formattedDate
    );
    
    // Calculate total TOIL hours for day
    const toilRecords = allRecords.filter(
      (record: any) => 
        record.userId === userId && 
        format(new Date(record.date), 'yyyy-MM-dd') === formattedDate
    );
    const toilHours = toilRecords.reduce((sum: number, record: any) => sum + (record.hours || 0), 0);
    
    return { hasAccrued: accrued, hasUsed: used, toilHours };
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
