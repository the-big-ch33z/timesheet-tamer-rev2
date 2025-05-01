import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";
import { format, isSameDay, parseISO } from "date-fns";
import { createTimeLogger } from '@/utils/time/errors';
import { v4 as uuidv4 } from "uuid";

const logger = createTimeLogger('TOILStorage');

// Storage keys
const TOIL_RECORDS_KEY = 'toilRecords';
const TOIL_USAGE_KEY = 'toilUsage';
const TOIL_SUMMARY_CACHE_KEY = 'toilSummaryCache';

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

// Store a TOIL record
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Check for duplicate by date and userId
    const existingIndex = records.findIndex(r => 
      r.userId === record.userId && 
      format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(record.date), 'yyyy-MM-dd')
    );
    
    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = record;
      logger.debug(`Updated existing TOIL record for ${format(record.date, 'yyyy-MM-dd')}`);
    } else {
      // Add new record
      records.push(record);
      logger.debug(`Added new TOIL record for ${format(record.date, 'yyyy-MM-dd')}`);
    }
    
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
    
    // Clear the summary cache for this month
    clearSummaryCache(record.userId, record.monthYear);
    
    return true;
  } catch (error) {
    logger.error('Error storing TOIL record:', error);
    return false;
  }
}

// Store TOIL usage
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    const usages = loadTOILUsage();
    usages.push(usage);
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usages));
    
    // Clear the summary cache for this month
    clearSummaryCache(usage.userId, usage.monthYear);
    
    return true;
  } catch (error) {
    logger.error('Error storing TOIL usage:', error);
    return false;
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

// Get TOIL summary for a user and month
export function getTOILSummary(userId: string, monthYear: string): TOILSummary {
  try {
    // Try to get cached summary first
    const cacheKey = `${TOIL_SUMMARY_CACHE_KEY}-${userId}-${monthYear}`;
    const cachedSummary = localStorage.getItem(cacheKey);
    
    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }
    
    // Calculate summary from records if not cached
    const records = loadTOILRecords();
    const usages = loadTOILUsage();
    
    // Filter records by user and month
    const userRecords = records.filter(
      record => record.userId === userId && record.monthYear === monthYear
    );
    
    // Filter usages by user and month
    const userUsages = usages.filter(
      usage => usage.userId === userId && usage.monthYear === monthYear
    );
    
    // Calculate total accrued hours
    const accrued = userRecords.reduce((total, record) => total + record.hours, 0);
    
    // Calculate total used hours
    const used = userUsages.reduce((total, usage) => total + usage.hours, 0);
    
    // Calculate remaining hours
    const remaining = accrued - used;
    
    const summary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
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

// Clean up duplicate TOIL records for a specific user
export async function cleanupDuplicateTOILRecords(userId: string): Promise<number> {
  try {
    const allRecords = loadTOILRecords();
    const uniqueDates = new Map<string, TOILRecord>();
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
        const existing = uniqueDates.get(dateKey)!;
        
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

// NEW: Get TOIL records for a specific day
export function getTOILRecordsForDay(userId: string, date: Date): TOILRecord[] {
  try {
    const records = loadTOILRecords();
    
    // Find records for this user and date
    return records.filter(record => 
      record.userId === userId && 
      isSameDay(new Date(record.date), date)
    );
  } catch (error) {
    logger.error('Error getting TOIL records for day:', error);
    return [];
  }
}

// NEW: Check if a day has TOIL accrued or used
export function hasTOILForDay(userId: string, date: Date): { 
  hasAccrued: boolean; 
  hasUsed: boolean;
  toilHours: number;
} {
  try {
    // Check for accrued TOIL
    const accrued = getTOILRecordsForDay(userId, date);
    const accrualHours = accrued.reduce((total, record) => total + record.hours, 0);
    
    // Check for used TOIL
    const usages = loadTOILUsage();
    const used = usages.filter(usage => 
      usage.userId === userId && 
      isSameDay(new Date(usage.date), date)
    );
    
    return {
      hasAccrued: accrued.length > 0,
      hasUsed: used.length > 0,
      toilHours: accrualHours
    };
  } catch (error) {
    logger.error('Error checking TOIL for day:', error);
    return {
      hasAccrued: false,
      hasUsed: false,
      toilHours: 0
    };
  }
}

/**
 * Delete a TOIL record associated with a specific entry ID
 * This is needed by the delete-operations.ts module
 */
export async function deleteTOILRecordByEntryId(entryId: string): Promise<boolean> {
  try {
    if (!entryId) {
      logger.error('No entry ID provided for TOIL record deletion');
      return false;
    }
    
    const allRecords = loadTOILRecords();
    const recordIndex = allRecords.findIndex(record => record.entryId === entryId);
    
    if (recordIndex === -1) {
      logger.debug(`No TOIL record found for entry ID ${entryId}`);
      return false;
    }
    
    // Store the user and month before deletion for cache clearing
    const { userId, monthYear } = allRecords[recordIndex];
    
    // Remove the record
    allRecords.splice(recordIndex, 1);
    
    // Save the updated records
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(allRecords));
    
    // Clear the summary cache
    clearSummaryCache(userId, monthYear);
    
    logger.debug(`Deleted TOIL record for entry ID ${entryId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting TOIL record:', error);
    return false;
  }
}

/**
 * Clear all TOIL caches for all users
 * This is used by the service.ts module
 */
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
