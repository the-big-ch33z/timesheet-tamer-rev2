import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";
import { storageWriteLock } from '../storage-operations';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from './types';
import { createTimeLogger } from '@/utils/time/errors';
import { format, isValid } from 'date-fns';

const logger = createTimeLogger('TOILStorage');

// Cache for TOIL summaries
const summaryCache = new Map<string, TOILSummary>();

/**
 * Validate a TOIL record
 */
function isValidRecord(record: any): record is TOILRecord {
  return (
    record &&
    typeof record.id === 'string' &&
    typeof record.userId === 'string' &&
    isValid(new Date(record.date)) &&
    typeof record.hours === 'number' &&
    record.hours >= 0 &&
    record.hours <= 24 &&
    typeof record.monthYear === 'string' &&
    /^\d{4}-\d{2}$/.test(record.monthYear)
  );
}

/**
 * Clear all TOIL data for a specific month
 */
export function clearTOILStorageForMonth(userId: string, monthYear: string): void {
  try {
    logger.debug(`Clearing TOIL data for ${userId}, month ${monthYear}`);
    
    // Clear caches for this month
    clearSummaryCache(userId, monthYear);
    
    // Filter records
    const allRecords = loadTOILRecords();
    const filteredRecords = allRecords.filter(
      record => !(record.userId === userId && record.monthYear === monthYear)
    );
    
    if (filteredRecords.length !== allRecords.length) {
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      logger.debug(`Removed ${allRecords.length - filteredRecords.length} records`);
    }
    
    // Filter usage
    const allUsage = loadTOILUsage();
    const filteredUsage = allUsage.filter(
      usage => !(usage.userId === userId && usage.monthYear === monthYear)
    );
    
    if (filteredUsage.length !== allUsage.length) {
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsage));
      logger.debug(`Removed ${allUsage.length - filteredUsage.length} usage records`);
    }
  } catch (error) {
    logger.error('Error clearing TOIL storage for month:', error);
  }
}

/**
 * Load TOIL records from storage
 */
export function loadTOILRecords(): TOILRecord[] {
  try {
    const storedRecords = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!storedRecords) {
      return [];
    }
    
    const parsedRecords = JSON.parse(storedRecords);
    
    // Validate and filter records
    const records: TOILRecord[] = parsedRecords
      .filter(isValidRecord)
      .map((record: any) => ({
        ...record,
        date: new Date(record.date)
      }));
    
    const invalidCount = parsedRecords.length - records.length;
    if (invalidCount > 0) {
      logger.warn(`Filtered out ${invalidCount} invalid TOIL records`);
    }
    
    return records;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load TOIL usage records from storage
 */
export function loadTOILUsage(): TOILUsage[] {
  try {
    const storedUsage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!storedUsage) {
      return [];
    }
    
    const parsedUsage = JSON.parse(storedUsage);
    
    // Validate and filter usage records
    const usage: TOILUsage[] = parsedUsage
      .filter((u: any) => 
        u && 
        typeof u.id === 'string' && 
        typeof u.userId === 'string' && 
        isValid(new Date(u.date)) &&
        typeof u.hours === 'number' &&
        u.hours >= 0 &&
        u.hours <= 24
      )
      .map((u: any) => ({
        ...u,
        date: new Date(u.date)
      }));
      
    const invalidCount = parsedUsage.length - usage.length;
    if (invalidCount > 0) {
      logger.warn(`Filtered out ${invalidCount} invalid TOIL usage records`);
    }
    
    return usage;
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Store a TOIL record
 */
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    // Acquire lock
    await storageWriteLock.acquire();
    
    try {
      // Get existing records
      const records = loadTOILRecords();
      
      // Check for duplicate
      const existingIndex = records.findIndex(r => 
        r.userId === record.userId && 
        format(r.date, 'yyyy-MM-dd') === format(record.date, 'yyyy-MM-dd')
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
      
      // Save records
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
      
      // Clear summary cache
      clearSummaryCache(record.userId, record.monthYear);
      
      return true;
    } finally {
      // Release lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error storing TOIL record:', error);
    return false;
  }
}

/**
 * Update an existing TOIL record
 */
export async function updateTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    // Acquire lock
    await storageWriteLock.acquire();
    
    try {
      // Get existing records
      const records = loadTOILRecords();
      
      // Find and update the record
      const index = records.findIndex(r => r.id === record.id);
      if (index >= 0) {
        records[index] = record;
        
        // Save records
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
        
        // Clear summary cache
        clearSummaryCache();
        
        logger.debug(`Updated TOIL record: ${record.id}, ${record.hours} hours`);
        return true;
      }
      
      return false;
    } finally {
      // Release lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error updating TOIL record:', error);
    return false;
  }
}

/**
 * Store TOIL usage
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    // Acquire lock
    await storageWriteLock.acquire();
    
    try {
      // Get existing usage records
      const usageRecords = loadTOILUsage();
      
      // Check for existing usage record with same id
      const existingIndex = usageRecords.findIndex(r => r.id === usage.id);
      
      if (existingIndex >= 0) {
        // Update existing record
        usageRecords[existingIndex] = usage;
      } else {
        // Add new usage record
        usageRecords.push(usage);
      }
      
      // Save usage records
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usageRecords));
      
      // Clear summary cache
      clearSummaryCache(usage.userId, usage.monthYear);
      
      logger.debug(`Stored TOIL usage: ${usage.id}, ${usage.hours} hours`);
      return true;
    } finally {
      // Release lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error storing TOIL usage:', error);
    return false;
  }
}

/**
 * Update existing TOIL usage
 */
export async function updateTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    // Acquire lock
    await storageWriteLock.acquire();
    
    try {
      // Get existing usage records
      const usageRecords = loadTOILUsage();
      
      // Find and update the usage record
      const index = usageRecords.findIndex(r => r.id === usage.id);
      if (index >= 0) {
        usageRecords[index] = usage;
        
        // Save usage records
        localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usageRecords));
        
        // Clear summary cache
        clearSummaryCache();
        
        logger.debug(`Updated TOIL usage: ${usage.id}, ${usage.hours} hours`);
        return true;
      }
      
      return false;
    } finally {
      // Release lock
      storageWriteLock.release();
    }
  } catch (error) {
    logger.error('Error updating TOIL usage:', error);
    return false;
  }
}

/**
 * Get TOIL summary for a user and month
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary {
  try {
    // Validate inputs
    if (!userId || !monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      logger.warn(`Invalid inputs for getTOILSummary: userId=${userId}, monthYear=${monthYear}`);
      return {
        userId: userId || '',
        monthYear: monthYear || format(new Date(), 'yyyy-MM'),
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
    
    // Check cache first
    const cacheKey = `${userId}-${monthYear}`;
    if (summaryCache.has(cacheKey)) {
      return { ...summaryCache.get(cacheKey)! };
    }
    
    const records = loadTOILRecords();
    const usage = loadTOILUsage();
    
    logger.debug(`[TOILStorage] Getting summary for user=${userId}, month=${monthYear}, records=${records.length}, usage=${usage.length}`);
    
    // Filter records for this user and month
    const userRecords = records.filter(
      record => record.userId === userId && record.monthYear === monthYear
    );
    
    // Filter usage for this user and month
    const userUsage = usage.filter(
      usage => usage.userId === userId && usage.monthYear === monthYear
    );
    
    // Calculate accrued hours
    const accrued = userRecords.reduce((sum, record) => sum + record.hours, 0);
    
    // Calculate used hours
    const used = userUsage.reduce((sum, usage) => sum + usage.hours, 0);
    
    // Calculate remaining hours
    const remaining = Math.max(0, accrued - used);
    
    logger.debug(`[TOILStorage] Summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
    
    const summary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the result
    summaryCache.set(cacheKey, summary);
    
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

/**
 * Clear summary cache for a specific user and month
 */
export function clearSummaryCache(userId?: string, monthYear?: string): void {
  if (userId && monthYear) {
    // Clear specific cache entry
    const cacheKey = `${userId}-${monthYear}`;
    summaryCache.delete(cacheKey);
    logger.debug(`Cleared TOIL summary cache for ${userId}, month=${monthYear}`);
  } else {
    // Clear all cache
    summaryCache.clear();
    logger.debug('TOIL summary cache cleared');
  }
}

/**
 * Clear all TOIL caches and localStorage
 */
export function clearAllTOILCaches(): void {
  clearSummaryCache();
  logger.debug('All TOIL caches cleared');
}

/**
 * Delete TOIL record by entry ID
 */
export function deleteTOILRecordByEntryId(entryId: string): boolean {
  try {
    logger.debug(`Attempting to delete TOIL record for entry: ${entryId}`);
    
    // Get all records
    const records = loadTOILRecords();
    const usage = loadTOILUsage();
    
    // Find and remove records associated with this entry
    const updatedRecords = records.filter(record => record.entryId !== entryId);
    const updatedUsage = usage.filter(u => u.entryId !== entryId);
    
    // If we found and removed any records, save the updates
    if (updatedRecords.length !== records.length || updatedUsage.length !== usage.length) {
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords));
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(updatedUsage));
      
      // Clear cache for affected records
      clearAllTOILCaches();
      
      logger.debug(`Successfully deleted TOIL records for entry: ${entryId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error deleting TOIL record:', error);
    return false;
  }
}
