// Add proper export for TOILDayInfo interface
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOILRecord, TOILUsage, TOILSummary } from '@/types/toil';
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY, 
  TOIL_SUMMARY_CACHE_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';
import { attemptStorageOperation } from './utils';

const logger = createTimeLogger('TOILStorageQueries');

// Get all TOIL records for a specific user
export const getUserTOILRecords = (userId: string): TOILRecord[] => {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      logger.debug(`No TOIL records found for user ${userId}`);
      return [];
    }
    
    const allRecords: TOILRecord[] = JSON.parse(records);
    const userRecords = allRecords.filter(record => record.userId === userId);
    
    logger.debug(`Found ${userRecords.length} TOIL records for user ${userId}`);
    return userRecords;
  } catch (error) {
    logger.error(`Error getting TOIL records for user ${userId}:`, error);
    return [];
  }
};

// Find TOIL records by entry ID
export const findTOILRecordsByEntryId = (entryId: string): TOILRecord[] => {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      logger.debug(`No TOIL records found for entry ID ${entryId}`);
      return [];
    }
    
    const allRecords: TOILRecord[] = JSON.parse(records);
    const entryRecords = allRecords.filter(record => record.entryId === entryId);
    
    logger.debug(`Found ${entryRecords.length} TOIL records for entry ID ${entryId}`);
    return entryRecords;
  } catch (error) {
    logger.error(`Error getting TOIL records for entry ID ${entryId}:`, error);
    return [];
  }
};

// Delete TOIL record by entry ID
export const deleteTOILRecordByEntryId = async (entryId: string): Promise<boolean> => {
  try {
    return await attemptStorageOperation(async () => {
      const records = localStorage.getItem(TOIL_RECORDS_KEY);
      if (!records) {
        logger.debug(`No TOIL records found to delete for entry ID ${entryId}`);
        return true; // Consider it successful if there's nothing to delete
      }
      
      let allRecords: TOILRecord[] = JSON.parse(records);
      const initialLength = allRecords.length;
      allRecords = allRecords.filter(record => record.entryId !== entryId);
      
      if (allRecords.length === initialLength) {
        logger.debug(`No TOIL records found to delete for entry ID ${entryId}`);
        return true; // Consider it successful if no records were deleted
      }
      
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(allRecords));
      logger.debug(`Deleted TOIL records for entry ID ${entryId}`);
      return true;
    }, `deleteTOILRecordByEntryId - ${entryId}`);
  } catch (error) {
    logger.error(`Error deleting TOIL record for entry ID ${entryId}:`, error);
    return false;
  }
};

// Check if there is TOIL accrued or used for a specific day
export const hasTOILForDay = (userId: string, day: Date): TOILDayInfo => {
  try {
    const dateString = format(day, 'yyyy-MM-dd');
    logger.debug(`Checking TOIL for day: ${dateString} for user: ${userId}`);
    
    let hasAccrued = false;
    let hasUsed = false;
    let toilHours = 0;
    
    // Check TOIL records
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (records) {
      const allRecords: TOILRecord[] = JSON.parse(records);
      const dayRecords = allRecords.filter(record => 
        record.userId === userId && format(record.date instanceof Date ? record.date : new Date(record.date), 'yyyy-MM-dd') === dateString
      );
      
      if (dayRecords.length > 0) {
        hasAccrued = true;
        toilHours += dayRecords.reduce((sum, record) => sum + record.hours, 0);
      }
    }
    
    // Check TOIL usage
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    if (usage) {
      const allUsage: TOILUsage[] = JSON.parse(usage);
      const dayUsage = allUsage.filter(record => 
        record.userId === userId && format(record.date instanceof Date ? record.date : new Date(record.date), 'yyyy-MM-dd') === dateString
      );
      
      if (dayUsage.length > 0) {
        hasUsed = true;
        toilHours -= dayUsage.reduce((sum, record) => sum + record.hours, 0);
      }
    }
    
    logger.debug(`TOIL for ${dateString}: Accrued=${hasAccrued}, Used=${hasUsed}, Hours=${toilHours}`);
    return {
      hasAccrued,
      hasUsed,
      toilHours
    };
  } catch (error) {
    logger.error(`Error checking TOIL for day ${format(day, 'yyyy-MM-dd')} for user ${userId}:`, error);
    return {
      hasAccrued: false,
      hasUsed: false,
      toilHours: 0
    };
  }
};

// Check if there is any TOIL data for a specific month
export const hasTOILForMonth = (userId: string, monthYear: string): boolean => {
  try {
    logger.debug(`Checking if TOIL exists for ${userId} in ${monthYear}`);
    
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!records && !usage) {
      logger.debug(`No TOIL records or usage found for ${userId} in ${monthYear}`);
      return false;
    }
    
    let hasTOIL = false;
    
    if (records) {
      const allRecords: TOILRecord[] = JSON.parse(records);
      hasTOIL = allRecords.some(record => record.userId === userId && record.monthYear === monthYear);
    }
    
    if (!hasTOIL && usage) {
      const allUsage: TOILUsage[] = JSON.parse(usage);
      hasTOIL = allUsage.some(record => record.userId === userId && record.monthYear === monthYear);
    }
    
    logger.debug(`TOIL exists for ${userId} in ${monthYear}: ${hasTOIL}`);
    return hasTOIL;
  } catch (error) {
    logger.error(`Error checking if TOIL exists for ${userId} in ${monthYear}:`, error);
    return false;
  }
};

// Get TOIL summary for a user and month
export const getTOILSummary = (userId: string, monthYear: string): TOILSummary => {
  const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
  try {
    // Check if the summary is already cached
    const cachedSummary = localStorage.getItem(cacheKey);
    if (cachedSummary) {
      const parsedSummary: TOILSummary = JSON.parse(cachedSummary);
      logger.debug(`Returning cached TOIL summary for ${userId} in ${monthYear}`);
      return parsedSummary;
    }
    
    logger.debug(`Calculating TOIL summary for ${userId} in ${monthYear}`);
    
    let accrued = 0;
    let used = 0;
    
    // Calculate accrued TOIL
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (records) {
      const allRecords: TOILRecord[] = JSON.parse(records);
      const monthRecords = allRecords.filter(record => record.userId === userId && record.monthYear === monthYear);
      accrued = monthRecords.reduce((sum, record) => sum + record.hours, 0);
    }
    
    // Calculate used TOIL
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    if (usage) {
      const allUsage: TOILUsage[] = JSON.parse(usage);
      const monthUsage = allUsage.filter(record => record.userId === userId && record.monthYear === monthYear);
      used = monthUsage.reduce((sum, record) => sum + record.hours, 0);
    }
    
    const remaining = accrued - used;
    
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the summary
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    logger.debug(`Cached TOIL summary for ${userId} in ${monthYear}`);
    
    return summary;
  } catch (error) {
    logger.error(`Error getting TOIL summary for ${userId} in ${monthYear}:`, error);
    return {
      userId,
      monthYear,
      accrued: 0,
      used: 0,
      remaining: 0
    };
  }
};
