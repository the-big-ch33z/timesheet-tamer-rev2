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
