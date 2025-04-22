
import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";
import { storageWriteLock } from '../storage-operations';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from './types';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';

const logger = createTimeLogger('TOILStorage');

// Cache for TOIL summaries
const summaryCache = new Map<string, TOILSummary>();

/**
 * Load TOIL records from storage
 */
export function loadTOILRecords(): TOILRecord[] {
  try {
    const storedRecords = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!storedRecords) {
      return [];
    }
    
    const records: TOILRecord[] = JSON.parse(storedRecords).map((record: any) => ({
      ...record,
      date: new Date(record.date)
    }));
    
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
    
    const usage: TOILUsage[] = JSON.parse(storedUsage).map((usage: any) => ({
      ...usage,
      date: new Date(usage.date)
    }));
    
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
      
      // Add new record
      records.push(record);
      
      // Save records
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
      
      // Clear summary cache
      clearSummaryCache();
      
      logger.debug(`Stored TOIL record: ${record.id}, ${record.hours} hours`);
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
      
      // Add new usage record
      usageRecords.push(usage);
      
      // Save usage records
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usageRecords));
      
      // Clear summary cache
      clearSummaryCache();
      
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
 * Clear summary cache
 */
export function clearSummaryCache(): void {
  summaryCache.clear();
  logger.debug('TOIL summary cache cleared');
}

/**
 * Clear all TOIL caches
 */
export function clearAllTOILCaches(): void {
  clearSummaryCache();
  logger.debug('All TOIL caches cleared');
}
