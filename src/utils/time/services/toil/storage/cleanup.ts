import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from "./constants";
import { createTimeLogger } from "../../../errors/timeLogger";
import { loadTOILRecords, loadTOILUsage } from "./record-management";
import { TOILRecord, TOILUsage } from "@/types/toil";
import { format } from "date-fns";

const logger = createTimeLogger('toil-storage-cleanup');

/**
 * Cleanup duplicate TOIL records
 */
export const cleanupDuplicateTOILRecords = async (userId: string): Promise<number> => {
  try {
    const records = loadTOILRecords(userId);
    
    // Map to track unique records by date
    const uniqueMap = new Map<string, TOILRecord>();
    
    // Keep only the latest record for each date
    records.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      
      if (!uniqueMap.has(dateKey) || new Date(record.date) > new Date(uniqueMap.get(dateKey)!.date)) {
        uniqueMap.set(dateKey, record);
      }
    });
    
    // Convert back to array
    const uniqueRecords = Array.from(uniqueMap.values());
    
    // Count removed records
    const removed = records.length - uniqueRecords.length;
    
    // Save back to storage
    localStorage.setItem(`${TOIL_RECORDS_KEY}_${userId}`, JSON.stringify(uniqueRecords));
    
    return removed;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL records for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Cleanup duplicate TOIL usage entries
 */
export const cleanupDuplicateTOILUsage = async (userId: string): Promise<number> => {
  try {
    const usage = loadTOILUsage(userId);
    
    // Map to track unique usage by date
    const uniqueMap = new Map<string, TOILUsage>();
    
    // Keep only the latest usage for each date
    usage.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      
      if (!uniqueMap.has(dateKey) || new Date(entry.date) > new Date(uniqueMap.get(dateKey)!.date)) {
        uniqueMap.set(dateKey, entry);
      }
    });
    
    // Convert back to array
    const uniqueUsage = Array.from(uniqueMap.values());
    
    // Count removed entries
    const removed = usage.length - uniqueUsage.length;
    
    // Save back to storage
    localStorage.setItem(`${TOIL_USAGE_KEY}_${userId}`, JSON.stringify(uniqueUsage));
    
    return removed;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL usage for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Clear TOIL storage for a specific month
 */
export const clearTOILStorageForMonth = async (userId: string, monthYear: string): Promise<boolean> => {
  try {
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
    // Filter out records for the specified month
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return format(recordDate, 'yyyy-MM') !== monthYear;
    });
    
    // Filter out usage for the specified month
    const filteredUsage = usage.filter(entry => {
      const usageDate = new Date(entry.date);
      return format(usageDate, 'yyyy-MM') !== monthYear;
    });
    
    // Save back to storage
    localStorage.setItem(`${TOIL_RECORDS_KEY}_${userId}`, JSON.stringify(filteredRecords));
    localStorage.setItem(`${TOIL_USAGE_KEY}_${userId}`, JSON.stringify(filteredUsage));
    
    // Also clear the summary cache for this month
    localStorage.removeItem(`toilSummaryCache_${userId}_${monthYear}`);
    
    return true;
  } catch (error) {
    logger.error(`Error clearing TOIL storage for month ${monthYear}:`, error);
    return false;
  }
};
