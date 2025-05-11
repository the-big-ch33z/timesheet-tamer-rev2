import { TOILBalanceEntry, TOILUsageEntry, TOIL_STORAGE_KEY } from "./service";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('toil-storage');

const TOIL_RECORDS_KEY = 'toilRecords';
const TOIL_USAGE_KEY = 'toilUsage';

/**
 * Load TOIL data from storage
 */
export const loadTOILData = (userId: string): { accrued: number; used: number } => {
  try {
    const recordsJson = localStorage.getItem(`${TOIL_STORAGE_KEY}_${userId}`);
    
    if (!recordsJson) {
      return { accrued: 0, used: 0 };
    }
    
    const data = JSON.parse(recordsJson);
    return {
      accrued: typeof data.accrued === 'number' ? data.accrued : 0,
      used: typeof data.used === 'number' ? data.used : 0
    };
  } catch (error) {
    logger.error(`Error loading TOIL data for user ${userId}:`, error);
    return { accrued: 0, used: 0 };
  }
};

/**
 * Save TOIL data to storage
 */
export const saveTOILData = (
  userId: string,
  accrued: number,
  used: number
): boolean => {
  try {
    const data = { accrued, used };
    localStorage.setItem(`${TOIL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error(`Error saving TOIL data for user ${userId}:`, error);
    return false;
  }
};

/**
 * Clear TOIL cache for a specific user
 */
export const clearTOILCache = (userId: string): boolean => {
  try {
    localStorage.removeItem(`${TOIL_STORAGE_KEY}_${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL cache for user ${userId}:`, error);
    return false;
  }
};

/**
 * Clear all TOIL caches
 */
export const clearAllTOILCaches = (): boolean => {
  try {
    // Find all TOIL-related keys and remove them
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TOIL_STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    }
    return true;
  } catch (error) {
    logger.error('Error clearing all TOIL caches:', error);
    return false;
  }
};

/**
 * Load TOIL records for a user
 */
export const loadTOILRecords = (userId: string): TOILBalanceEntry[] => {
  try {
    const recordsJson = localStorage.getItem(`${TOIL_RECORDS_KEY}_${userId}`);
    
    if (!recordsJson) {
      return [];
    }
    
    return JSON.parse(recordsJson);
  } catch (error) {
    logger.error(`Error loading TOIL records for user ${userId}:`, error);
    return [];
  }
};

/**
 * Load TOIL usage for a user
 */
export const loadTOILUsage = (userId: string): TOILUsageEntry[] => {
  try {
    const usageJson = localStorage.getItem(`${TOIL_USAGE_KEY}_${userId}`);
    
    if (!usageJson) {
      return [];
    }
    
    return JSON.parse(usageJson);
  } catch (error) {
    logger.error(`Error loading TOIL usage for user ${userId}:`, error);
    return [];
  }
};

/**
 * Cleanup duplicate TOIL records
 */
export const cleanupDuplicateTOILRecords = async (userId: string): Promise<boolean> => {
  try {
    const records = loadTOILRecords(userId);
    
    // Map to track unique records by date
    const uniqueMap = new Map<string, TOILBalanceEntry>();
    
    // Keep only the latest record for each date
    records.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      
      if (!uniqueMap.has(dateKey) || new Date(record.timestamp) > new Date(uniqueMap.get(dateKey)!.timestamp)) {
        uniqueMap.set(dateKey, record);
      }
    });
    
    // Convert back to array
    const uniqueRecords = Array.from(uniqueMap.values());
    
    // Save back to storage
    localStorage.setItem(`${TOIL_RECORDS_KEY}_${userId}`, JSON.stringify(uniqueRecords));
    
    return true;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL records for user ${userId}:`, error);
    return false;
  }
};

/**
 * Cleanup duplicate TOIL usage entries
 */
export const cleanupDuplicateTOILUsage = async (userId: string): Promise<boolean> => {
  try {
    const usage = loadTOILUsage(userId);
    
    // Map to track unique usage by date
    const uniqueMap = new Map<string, TOILUsageEntry>();
    
    // Keep only the latest usage for each date
    usage.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      
      if (!uniqueMap.has(dateKey) || new Date(entry.timestamp) > new Date(uniqueMap.get(dateKey)!.timestamp)) {
        uniqueMap.set(dateKey, entry);
      }
    });
    
    // Convert back to array
    const uniqueUsage = Array.from(uniqueMap.values());
    
    // Save back to storage
    localStorage.setItem(`${TOIL_USAGE_KEY}_${userId}`, JSON.stringify(uniqueUsage));
    
    return true;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL usage for user ${userId}:`, error);
    return false;
  }
};
