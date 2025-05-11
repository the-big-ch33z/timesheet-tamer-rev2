
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from "./constants";
import { createTimeLogger } from "../../../errors/timeLogger";
import { TOILRecord, TOILUsage } from "@/types/toil";
import { TOILBalanceEntry, TOILUsageEntry } from "../service";

const logger = createTimeLogger('toil-record-management');

/**
 * Load TOIL records for a user
 */
export const loadTOILRecords = (userId: string): TOILRecord[] => {
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
export const loadTOILUsage = (userId: string): TOILUsage[] => {
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
 * Store TOIL record
 */
export const storeTOILRecord = async (record: TOILRecord): Promise<boolean> => {
  if (!record.userId) {
    logger.error('Cannot store TOIL record without userId');
    return false;
  }
  
  try {
    const records = loadTOILRecords(record.userId);
    
    // Check for duplicate
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = {...record};
    } else {
      // Add new record
      records.push(record);
    }
    
    // Save back to storage
    localStorage.setItem(`${TOIL_RECORDS_KEY}_${record.userId}`, JSON.stringify(records));
    
    return true;
  } catch (error) {
    logger.error(`Error storing TOIL record:`, error);
    return false;
  }
};

/**
 * Store TOIL usage
 */
export const storeTOILUsage = async (usage: TOILUsage): Promise<boolean> => {
  if (!usage.userId) {
    logger.error('Cannot store TOIL usage without userId');
    return false;
  }
  
  try {
    const usages = loadTOILUsage(usage.userId);
    
    // Check for duplicate
    const existingIndex = usages.findIndex(u => u.id === usage.id);
    
    if (existingIndex >= 0) {
      // Update existing usage
      usages[existingIndex] = {...usage};
    } else {
      // Add new usage
      usages.push(usage);
    }
    
    // Save back to storage
    localStorage.setItem(`${TOIL_USAGE_KEY}_${usage.userId}`, JSON.stringify(usages));
    
    return true;
  } catch (error) {
    logger.error(`Error storing TOIL usage:`, error);
    return false;
  }
};
