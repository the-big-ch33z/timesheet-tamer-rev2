import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from './constants';
import { attemptStorageOperation } from '../storage/utils';

const logger = createTimeLogger('TOILStorageQueries');

// Define the TOILDayInfo interface
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
 * Get a summary of TOIL for a specific user and date
 */
export const getTOILSummary = async (userId: string, date: Date): Promise<any | null> => {
  const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${format(date, 'yyyy-MM-dd')}`;
  
  try {
    const cachedSummary = localStorage.getItem(cacheKey);
    if (cachedSummary) {
      logger.debug(`Returning cached TOIL summary for ${userId} on ${format(date, 'yyyy-MM-dd')}`);
      return JSON.parse(cachedSummary);
    }
    
    logger.debug(`No cached TOIL summary found for ${userId} on ${format(date, 'yyyy-MM-dd')}`);
    return null;
  } catch (error) {
    logger.error(`Error getting cached TOIL summary for ${userId} on ${format(date, 'yyyy-MM-dd')}:`, error);
    return null;
  }
};

/**
 * Check if a user has any TOIL records for a specific day
 */
export const hasTOILForDay = async (userId: string, date: Date): Promise<boolean> => {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      return false;
    }
    
    const allRecords = JSON.parse(records);
    
    // Format the date for comparison (assuming records store dates as strings)
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const hasTOIL = allRecords.some(
      (record: any) => 
        record.userId === userId && 
        format(new Date(record.date), 'yyyy-MM-dd') === formattedDate
    );
    
    return hasTOIL;
  } catch (error) {
    logger.error(`Error checking TOIL for day ${date} and user ${userId}:`, error);
    return false;
  }
};

/**
 * Check if a user has any TOIL records for a specific month
 */
export const hasTOILForMonth = async (userId: string, date: Date): Promise<boolean> => {
  try {
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!records) {
      return false;
    }
    
    const allRecords = JSON.parse(records);
    
    const hasTOIL = allRecords.some(
      (record: any) => 
        record.userId === userId &&
        new Date(record.date).getFullYear() === date.getFullYear() &&
        new Date(record.date).getMonth() === date.getMonth()
    );
    
    return hasTOIL;
  } catch (error) {
    logger.error(`Error checking TOIL for month ${date} and user ${userId}:`, error);
    return false;
  }
};
