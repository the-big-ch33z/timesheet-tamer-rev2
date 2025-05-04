
import { TOILRecord, TOILSummary } from "@/types/toil";
import { format, isSameDay } from "date-fns";
import { loadTOILRecords, loadTOILUsage } from './record-management';
import { TOIL_SUMMARY_CACHE_KEY } from './constants';
import { createTimeLogger } from "@/utils/time/errors";
import { cleanupDuplicateTOILRecords } from "./cleanup";

const logger = createTimeLogger('TOILQueries');

/**
 * Get all TOIL records for a specific user
 */
export function getUserTOILRecords(userId: string): TOILRecord[] {
  try {
    logger.debug(`Getting TOIL records for user: ${userId}`);
    
    // Get all records
    const records = loadTOILRecords();
    
    // Filter for this user
    const userRecords = records.filter(record => record.userId === userId);
    
    logger.debug(`Found ${userRecords.length} TOIL records for user ${userId}`);
    return userRecords;
  } catch (error) {
    logger.error('Error getting user TOIL records:', error);
    
    // Attempt cleanup as a recovery mechanism
    try {
      cleanupDuplicateTOILRecords(userId);
    } catch (innerError) {
      // Silent attempt
    }
    
    return [];
  }
}

/**
 * Find TOIL records by entry ID
 */
export function findTOILRecordsByEntryId(entryId: string): TOILRecord[] {
  try {
    logger.debug(`Finding TOIL records for entry ID: ${entryId}`);
    
    // Get all records
    const records = loadTOILRecords();
    
    // Filter for this entry ID
    const matchingRecords = records.filter(record => record.entryId === entryId);
    
    logger.debug(`Found ${matchingRecords.length} TOIL records for entry ID ${entryId}`);
    return matchingRecords;
  } catch (error) {
    logger.error('Error finding TOIL records by entry ID:', error);
    return [];
  }
}

/**
 * Delete TOIL records by entry ID
 */
export function deleteTOILRecordByEntryId(entryId: string): boolean {
  try {
    logger.debug(`Deleting TOIL records for entry ID: ${entryId}`);
    
    // Get all records
    const allRecords = loadTOILRecords();
    
    // Find records to delete
    const recordsToDelete = allRecords.filter(record => record.entryId === entryId);
    
    if (recordsToDelete.length === 0) {
      logger.debug(`No TOIL records found for entry ID: ${entryId}`);
      return true; // Nothing to delete is still a success
    }
    
    // Filter out records for this entry ID
    const updatedRecords = allRecords.filter(record => record.entryId !== entryId);
    
    // Save the updated records back to localStorage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords));
    
    logger.debug(`Successfully deleted ${recordsToDelete.length} TOIL records for entry ID: ${entryId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting TOIL records by entry ID:', error);
    return false;
  }
}

/**
 * Check if there is TOIL for a specific day
 * @returns Object with TOIL status for the day
 */
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

export function hasTOILForDay(userId: string, date: Date): TOILDayInfo {
  try {
    logger.debug(`Checking for TOIL on date: ${format(date, 'yyyy-MM-dd')} for user: ${userId}`);
    
    // Get all records for this user
    const userRecords = getUserTOILRecords(userId);
    const userUsage = loadTOILUsage().filter(usage => usage.userId === userId);
    
    // Check if there is any accrual for this day
    const hasAccrued = userRecords.some(record => 
      isSameDay(new Date(record.date), date) && record.status === 'active'
    );
    
    // Check if there is any usage for this day
    const hasUsed = userUsage.some(usage => 
      isSameDay(new Date(usage.date), date)
    );
    
    // Calculate total TOIL hours for the day (accrued - used)
    const accrualHours = userRecords
      .filter(record => isSameDay(new Date(record.date), date) && record.status === 'active')
      .reduce((sum, record) => sum + record.hours, 0);
    
    const usageHours = userUsage
      .filter(usage => isSameDay(new Date(usage.date), date))
      .reduce((sum, usage) => sum + usage.hours, 0);
    
    const toilHours = accrualHours - usageHours;
    
    logger.debug(`TOIL for day ${format(date, 'yyyy-MM-dd')}: Accrued=${hasAccrued}, Used=${hasUsed}, Hours=${toilHours}`);
    
    return {
      hasAccrued,
      hasUsed,
      toilHours
    };
  } catch (error) {
    logger.error('Error checking if day has TOIL:', error);
    return {
      hasAccrued: false,
      hasUsed: false,
      toilHours: 0
    };
  }
}

/**
 * Check if there is TOIL for a specific month
 */
export function hasTOILForMonth(userId: string, monthYear: string): boolean {
  try {
    logger.debug(`Checking for TOIL in month: ${monthYear} for user: ${userId}`);
    
    // Get all records for this user
    const userRecords = getUserTOILRecords(userId);
    
    // Check if there is a record for this month
    const hasTOIL = userRecords.some(record => 
      record.monthYear === monthYear && record.status === 'active'
    );
    
    logger.debug(`TOIL for month ${monthYear}: ${hasTOIL ? 'Yes' : 'No'}`);
    return hasTOIL;
  } catch (error) {
    logger.error('Error checking if month has TOIL:', error);
    return false;
  }
}

/**
 * Get TOIL summary for a specific month and user
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary {
  try {
    logger.debug(`Getting TOIL summary for user: ${userId}, month: ${monthYear}`);
    
    // Check if summary is cached
    const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
    const cachedSummary = localStorage.getItem(cacheKey);
    
    if (cachedSummary) {
      logger.debug(`Using cached TOIL summary for ${monthYear}`);
      return JSON.parse(cachedSummary);
    }
    
    // Get all records and usage for this user
    const allRecords = loadTOILRecords();
    const allUsage = loadTOILUsage();
    
    // Filter to user and month
    const monthRecords = allRecords.filter(record => 
      record.userId === userId && 
      record.monthYear === monthYear &&
      record.status === 'active'
    );
    
    const monthUsage = allUsage.filter(usage => 
      usage.userId === userId && 
      usage.monthYear === monthYear
    );
    
    // Calculate totals
    const accrued = monthRecords.reduce((total, record) => total + record.hours, 0);
    const used = monthUsage.reduce((total, usage) => total + usage.hours, 0);
    const remaining = Math.max(0, accrued - used);
    
    // Create summary object
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the summary
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    logger.debug(`TOIL summary calculated for ${monthYear}: Accrued=${accrued}, Used=${used}, Remaining=${remaining}`);
    return summary;
    
  } catch (error) {
    logger.error('Error getting TOIL summary:', error);
    return {
      userId,
      monthYear,
      accrued: 0,
      used: 0,
      remaining: 0
    };
  }
}
