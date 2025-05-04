import { format } from "date-fns";
import { createTimeLogger } from '@/utils/time/errors';
import { clearSummaryCache } from './core';
import { loadTOILRecords, loadTOILUsage } from './record-management';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from './constants';

const logger = createTimeLogger('TOILCleanup');

/**
 * Remove duplicate TOIL records for a user
 * @param userId The user ID
 * @returns Promise resolving to the number of duplicates removed
 */
export async function cleanupDuplicateTOILRecords(userId: string): Promise<number> {
  try {
    logger.debug(`Cleaning up duplicate TOIL records for user: ${userId}`);
    
    // Get all records
    const records = loadTOILRecords();
    
    // Get records for this user
    const userRecords = records.filter(record => record.userId === userId);
    
    if (userRecords.length === 0) {
      logger.debug(`No TOIL records found for user: ${userId}`);
      return 0;
    }
    
    // Track unique dates to avoid duplicates
    const uniqueDates = new Map<string, { id: string, date: Date, hours: number }>();
    let duplicatesRemoved = 0;
    
    // Process all records, keeping only the most recent for each day
    userRecords.forEach(record => {
      const dateKey = format(record.date, 'yyyy-MM-dd');
      
      if (!uniqueDates.has(dateKey)) {
        // First record for this day
        uniqueDates.set(dateKey, { id: record.id, date: record.date, hours: record.hours });
      } else {
        // We already have a record for this day
        const existing = uniqueDates.get(dateKey)!;
        
        // If this record is newer (higher ID), replace the existing one
        if (record.id > existing.id) {
          uniqueDates.set(dateKey, { id: record.id, date: record.date, hours: record.hours });
        }
        
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      logger.debug(`Found ${duplicatesRemoved} duplicate TOIL records for user ${userId}`);
      
      // Create a new array with only the unique records
      const cleanedRecords = records.filter(record => 
        record.userId !== userId || // Keep records for other users
        (uniqueDates.has(format(record.date, 'yyyy-MM-dd')) && 
         uniqueDates.get(format(record.date, 'yyyy-MM-dd'))?.id === record.id)
      );
      
      // Save back to localStorage
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(cleanedRecords));
      
      // Clear the cache for all affected months
      const months = Array.from(uniqueDates.values()).map(v => format(v.date, 'yyyy-MM'));
      const uniqueMonths = [...new Set(months)];
      
      for (const month of uniqueMonths) {
        clearSummaryCache(userId, month);
      }
      
      logger.debug(`Removed ${duplicatesRemoved} duplicate TOIL records for user ${userId}`);
    }
    
    return duplicatesRemoved;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL records:', error);
    return 0;
  }
}

/**
 * Remove duplicate TOIL usage records for a user
 * @param userId The user ID
 * @returns Promise resolving to the number of duplicates removed
 */
export async function cleanupDuplicateTOILUsage(userId: string): Promise<number> {
  try {
    logger.debug(`Cleaning up duplicate TOIL usage for user: ${userId}`);
    
    // Get all usage records
    const usages = loadTOILUsage();
    
    // Get usage for this user
    const userUsages = usages.filter(usage => usage.userId === userId);
    
    if (userUsages.length === 0) {
      logger.debug(`No TOIL usage found for user: ${userId}`);
      return 0;
    }
    
    // Track unique entries to avoid duplicates
    const uniqueEntryIds = new Map<string, string>();
    const uniqueDates = new Map<string, { id: string, entryId: string }>();
    let duplicatesRemoved = 0;
    
    // Process all usages, keeping only the most recent for each entry ID
    userUsages.forEach(usage => {
      // First, check for duplicate entry IDs (exact same event)
      if (!uniqueEntryIds.has(usage.entryId)) {
        uniqueEntryIds.set(usage.entryId, usage.id);
        
        // Then check for duplicate days (potentially different entry IDs)
        const dateKey = format(usage.date, 'yyyy-MM-dd');
        
        if (!uniqueDates.has(dateKey)) {
          // First usage for this day
          uniqueDates.set(dateKey, { id: usage.id, entryId: usage.entryId });
        } else {
          // Keep newer one
          const existing = uniqueDates.get(dateKey)!;
          if (usage.id > existing.id) {
            uniqueDates.set(dateKey, { id: usage.id, entryId: usage.entryId });
          }
          duplicatesRemoved++;
        }
      } else {
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      logger.debug(`Found ${duplicatesRemoved} duplicate TOIL usage records for user ${userId}`);
      
      // Create a new array with only the unique records by entry ID
      const cleanedUsages = usages.filter(usage => 
        usage.userId !== userId || // Keep records for other users
        uniqueEntryIds.get(usage.entryId) === usage.id
      );
      
      // Save back to localStorage
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(cleanedUsages));
      
      // Clear the cache for this user
      clearSummaryCache(userId);
      
      logger.debug(`Removed ${duplicatesRemoved} duplicate TOIL usage records for user ${userId}`);
    }
    
    return duplicatesRemoved;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL usage:', error);
    return 0;
  }
}

/**
 * Clear all TOIL storage for a specific month and user
 * @param userId The user ID
 * @param monthYear The month in format 'yyyy-MM'
 * @returns True if successful, false otherwise
 */
export function clearTOILStorageForMonth(userId: string, monthYear: string): boolean {
  try {
    logger.debug(`Clearing TOIL storage for user ${userId}, month ${monthYear}`);
    
    // Load all records
    const allRecords = loadTOILRecords();
    const allUsage = loadTOILUsage();
    
    // Filter out records for this user and month
    const filteredRecords = allRecords.filter(record => 
      record.userId !== userId || record.monthYear !== monthYear
    );
    
    const filteredUsage = allUsage.filter(usage => 
      usage.userId !== userId || usage.monthYear !== monthYear
    );
    
    // Save filtered data back to storage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsage));
    
    // Clear the summary cache
    clearSummaryCache(userId, monthYear);
    
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL storage for month ${monthYear}:`, error);
    return false;
  }
}
