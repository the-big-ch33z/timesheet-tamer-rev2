import { format } from "date-fns";
import { createTimeLogger } from '@/utils/time/errors';
import { loadTOILRecords, loadTOILUsage, clearSummaryCache, TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from './core';

const logger = createTimeLogger('TOILCleanup');

// Clean up duplicate TOIL records for a specific user
export async function cleanupDuplicateTOILRecords(userId: string): Promise<number> {
  try {
    const allRecords = loadTOILRecords();
    const uniqueDates = new Map();
    let duplicatesRemoved = 0;
    
    // Filter records for this user
    const userRecords = allRecords.filter(r => r.userId === userId);
    
    // Process each record to find duplicates
    userRecords.forEach(record => {
      const dateKey = `${userId}-${format(new Date(record.date), 'yyyy-MM-dd')}`;
      
      if (!uniqueDates.has(dateKey)) {
        // First record for this date
        uniqueDates.set(dateKey, record);
      } else {
        // Duplicate found - keep the record with most hours
        const existing = uniqueDates.get(dateKey);
        
        // Keep the record with the highest hours or most recent ID if equal
        if (record.hours > existing.hours || 
            (record.hours === existing.hours && record.id > existing.id)) {
          uniqueDates.set(dateKey, record);
        }
        
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      // Keep records from other users
      const otherUserRecords = allRecords.filter(r => r.userId !== userId);
      
      // Combine with unique records for this user
      const cleanedRecords = [...otherUserRecords, ...uniqueDates.values()];
      
      // Save back to storage
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(cleanedRecords));
      logger.debug(`Removed ${duplicatesRemoved} duplicate TOIL records for user ${userId}`);
    }
    
    return duplicatesRemoved;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL records:', error);
    return 0;
  }
}

// NEW: Clean up duplicate TOIL usage records for a specific user
export async function cleanupDuplicateToilUsage(userId: string): Promise<number> {
  try {
    const allUsages = loadTOILUsage();
    const uniqueEntryIds = new Map();
    let duplicatesRemoved = 0;
    
    // Filter usages for this user
    const userUsages = allUsages.filter(u => u.userId === userId);
    
    // Process each usage to find duplicates by entryId
    userUsages.forEach(usage => {
      if (!uniqueEntryIds.has(usage.entryId)) {
        // First usage for this entry
        uniqueEntryIds.set(usage.entryId, usage);
      } else {
        // Duplicate found - keep the most recent one (assuming higher ID = newer)
        const existing = uniqueEntryIds.get(usage.entryId);
        
        // Keep the usage with the highest ID (most recent)
        if (usage.id > existing.id) {
          uniqueEntryIds.set(usage.entryId, usage);
        }
        
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      // Keep usages from other users
      const otherUserUsages = allUsages.filter(u => u.userId !== userId);
      
      // Combine with unique usages for this user
      const cleanedUsages = [...otherUserUsages, ...uniqueEntryIds.values()];
      
      // Save back to storage
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(cleanedUsages));
      logger.debug(`Removed ${duplicatesRemoved} duplicate TOIL usage records for user ${userId}`);
      
      // Clear summaries for affected months
      const months = new Set<string>();
      uniqueEntryIds.forEach(usage => months.add(usage.monthYear));
      months.forEach(monthYear => clearSummaryCache(userId, monthYear));
    }
    
    return duplicatesRemoved;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL usage records:', error);
    return 0;
  }
}

// Clean up all TOIL data for a user
export async function cleanupAllToilData(userId: string): Promise<boolean> {
  try {
    // Clean up both types of duplicates
    const recordsRemoved = await cleanupDuplicateTOILRecords(userId);
    const usagesRemoved = await cleanupDuplicateToilUsage(userId);
    
    logger.debug(`Cleanup complete for ${userId}: removed ${recordsRemoved} accrual and ${usagesRemoved} usage duplicates`);
    return (recordsRemoved > 0 || usagesRemoved > 0);
  } catch (error) {
    logger.error('Error cleaning up TOIL data:', error);
    return false;
  }
}

// Clear all TOIL storage for a specific month
export function clearTOILStorageForMonth(userId: string, monthYear: string): void {
  try {
    // Load all records
    const allRecords = loadTOILRecords();
    const allUsages = loadTOILUsage();
    
    // Filter out records for this user and month
    const filteredRecords = allRecords.filter(
      r => !(r.userId === userId && r.monthYear === monthYear)
    );
    
    // Filter out usages for this user and month
    const filteredUsages = allUsages.filter(
      u => !(u.userId === userId && u.monthYear === monthYear)
    );
    
    // Save filtered records and usages
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsages));
    
    // Clear the summary cache
    clearSummaryCache(userId, monthYear);
    
    logger.debug(`Cleared TOIL storage for ${userId} - ${monthYear}`);
  } catch (error) {
    logger.error('Error clearing TOIL storage:', error);
  }
}
