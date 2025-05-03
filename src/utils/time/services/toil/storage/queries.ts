
import { TOILRecord } from "@/types/toil";
import { format, isSameDay } from "date-fns";
import { loadTOILRecords, loadTOILUsage } from './core';
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILQueries');

// Get all TOIL records for a specific user
export function getUserTOILRecords(userId: string): TOILRecord[] {
  try {
    const allRecords = loadTOILRecords();
    logger.debug(`getUserTOILRecords: Retrieved ${allRecords.length} total records, filtering for user ${userId}`);
    const userRecords = allRecords.filter(record => record.userId === userId);
    logger.debug(`getUserTOILRecords: Found ${userRecords.length} records for user ${userId}`);
    return userRecords;
  } catch (error) {
    logger.error(`getUserTOILRecords: Error retrieving records for user ${userId}:`, error);
    return [];
  }
}

// Clean up duplicate TOIL records for a user
export async function cleanupDuplicateTOILRecords(userId: string): Promise<number> {
  try {
    const allRecords = loadTOILRecords();
    const uniqueDates = new Map<string, TOILRecord>();
    let duplicatesRemoved = 0;
    
    // Keep only the latest record for each date
    allRecords.filter(record => record.userId === userId).forEach(record => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      
      if (!uniqueDates.has(dateKey) || 
          new Date(record.date) > new Date(uniqueDates.get(dateKey)!.date)) {
        uniqueDates.set(dateKey, record);
      } else {
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      // Save the cleaned records back
      const cleanedRecords = allRecords.filter(record => {
        if (record.userId !== userId) return true;
        
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        return uniqueDates.get(dateKey)?.id === record.id;
      });
      
      localStorage.setItem('toilRecords', JSON.stringify(cleanedRecords));
      logger.debug(`Removed ${duplicatesRemoved} duplicate TOIL records for user ${userId}`);
    }
    
    return duplicatesRemoved;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL records:', error);
    return 0;
  }
}

// Check if a user has TOIL records for a specific day
export function hasTOILForDay(userId: string, date: Date): { 
  hasAccrued: boolean; 
  hasUsed: boolean;
  toilHours: number;
} {
  if (!userId || !date) {
    return { hasAccrued: false, hasUsed: false, toilHours: 0 };
  }
  
  try {
    // Load all records and usage
    const records = loadTOILRecords();
    const usage = loadTOILUsage();
    
    // Find records for this day
    const dayToilRecords = records.filter(record => 
      record.userId === userId && 
      isSameDay(new Date(record.date), date)
    );
    
    // Find usage for this day
    const dayToilUsage = usage.filter(usage => 
      usage.userId === userId && 
      isSameDay(new Date(usage.date), date)
    );
    
    // Sum up hours for this day
    const accruedHours = dayToilRecords.reduce((sum, record) => sum + record.hours, 0);
    const usedHours = dayToilUsage.reduce((sum, usage) => sum + usage.hours, 0);
    
    logger.debug(`hasTOILForDay: User ${userId}, date ${format(date, 'yyyy-MM-dd')}, accruedHours=${accruedHours}, usedHours=${usedHours}`);
    
    return { 
      hasAccrued: dayToilRecords.length > 0, 
      hasUsed: dayToilUsage.length > 0,
      toilHours: Math.max(accruedHours, usedHours)
    };
  } catch (error) {
    logger.error('Error checking TOIL for day:', error);
    return { hasAccrued: false, hasUsed: false, toilHours: 0 };
  }
}

// Find TOIL records by entry ID
export function findTOILRecordsByEntryId(entryId: string): TOILRecord[] {
  if (!entryId) return [];
  
  const allRecords = loadTOILRecords();
  return allRecords.filter(record => record.entryId === entryId);
}

// Check if a user has any TOIL for a specific month
export function hasTOILForMonth(userId: string, monthYear: string): boolean {
  try {
    const records = loadTOILRecords();
    const hasToil = records.some(record => record.userId === userId && record.monthYear === monthYear);
    logger.debug(`hasTOILForMonth: User ${userId}, month ${monthYear}, hasToil=${hasToil}`);
    return hasToil;
  } catch (error) {
    logger.error(`hasTOILForMonth: Error checking TOIL for month ${monthYear}:`, error);
    return false;
  }
}

// Delete all TOIL storage for a particular month
export function clearTOILStorageForMonth(userId: string, monthYear: string): boolean {
  try {
    // Get all records and usage
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
    localStorage.setItem('toilRecords', JSON.stringify(filteredRecords));
    localStorage.setItem('toilUsage', JSON.stringify(filteredUsage));
    
    // Clear the summary cache
    localStorage.removeItem(`toilSummaryCache-${userId}-${monthYear}`);
    
    return true;
  } catch (error) {
    logger.error('Error clearing TOIL storage for month:', error);
    return false;
  }
}

// Get TOIL summary for a user and month - improved implementation with better logging
export function getTOILSummary(userId: string, monthYear: string) {
  try {
    logger.debug(`Getting TOIL summary for ${userId}, month ${monthYear}`);
    
    // Validate input parameters
    if (!userId || !monthYear) {
      logger.warn(`Invalid parameters: userId=${userId}, monthYear=${monthYear}`);
      return {
        userId: userId || '',
        monthYear: monthYear || '',
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
    
    const records = loadTOILRecords();
    logger.debug(`Total TOIL records loaded: ${records.length}`);
    
    const usages = loadTOILUsage();
    logger.debug(`Total TOIL usage records loaded: ${usages.length}`);
    
    // Filter records for this user and month
    const userMonthRecords = records.filter(record => 
      record.userId === userId && record.monthYear === monthYear
    );
    logger.debug(`Found ${userMonthRecords.length} TOIL records for user ${userId}, month ${monthYear}`);
    
    // More strict filtering to avoid duplicates
    const uniqueDates = new Map<string, TOILRecord>();
    
    // Get unique records by date (take the most recent one)
    userMonthRecords.forEach(record => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      
      if (!uniqueDates.has(dateKey) || 
          new Date(record.date) > new Date(uniqueDates.get(dateKey)!.date)) {
        uniqueDates.set(dateKey, record);
      }
    });
    
    logger.debug(`After deduplication: ${uniqueDates.size} unique TOIL records`);
    
    // Calculate with unique records only
    const accrued = Array.from(uniqueDates.values())
      .reduce((sum, record) => sum + record.hours, 0);
    
    // Filter usages for this user and month
    const userUsages = usages.filter(usage => 
      usage.userId === userId && usage.monthYear === monthYear
    );
    logger.debug(`Found ${userUsages.length} TOIL usage records`);
    
    // Calculate used hours
    const used = userUsages.reduce((sum, usage) => sum + usage.hours, 0);
    const remaining = accrued - used;
    
    logger.debug(`TOIL calculation: accrued=${accrued}, used=${used}, remaining=${remaining}`);
    
    const summary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    logger.debug(`Final TOIL summary for ${userId}, month ${monthYear}:`, summary);
    
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
