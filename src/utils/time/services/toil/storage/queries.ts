
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "../../../errors/timeLogger";
import { loadTOILRecords, loadTOILUsage } from "./record-management";
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY, TOIL_SUMMARY_CACHE_KEY } from "./constants";
import { format } from "date-fns";

const logger = createTimeLogger('toil-storage-queries');

// Interface for TOIL day information
export interface TOILDayInfo {
  hasAccrual: boolean;
  hasUsage: boolean;
  accrualHours: number;
  usageHours: number;
}

/**
 * Get all TOIL records for a user
 */
export const getUserTOILRecords = (userId: string) => {
  try {
    const records = loadTOILRecords(userId);
    return records;
  } catch (error) {
    logger.error(`Error getting TOIL records for user ${userId}:`, error);
    return [];
  }
};

/**
 * Check if a user has TOIL records for a specific day
 */
export const hasTOILForDay = (userId: string, date: Date): TOILDayInfo => {
  try {
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    const dayAccruals = records.filter(record => {
      const recordDate = new Date(record.date);
      return format(recordDate, 'yyyy-MM-dd') === dateString;
    });
    
    const dayUsage = usage.filter(usage => {
      const usageDate = new Date(usage.date);
      return format(usageDate, 'yyyy-MM-dd') === dateString;
    });
    
    const accrualHours = dayAccruals.reduce((total, record) => total + record.hours, 0);
    const usageHours = dayUsage.reduce((total, usage) => total + usage.hours, 0);
    
    return {
      hasAccrual: dayAccruals.length > 0,
      hasUsage: dayUsage.length > 0,
      accrualHours,
      usageHours
    };
  } catch (error) {
    logger.error(`Error checking TOIL for day for user ${userId}:`, error);
    return {
      hasAccrual: false,
      hasUsage: false,
      accrualHours: 0,
      usageHours: 0
    };
  }
};

/**
 * Check if a user has TOIL records for a specific month
 */
export const hasTOILForMonth = (userId: string, date: Date | string): boolean => {
  try {
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
    const monthYear = typeof date === 'string' ? date : format(date, 'yyyy-MM');
    
    const monthAccruals = records.filter(record => {
      const recordDate = new Date(record.date);
      return format(recordDate, 'yyyy-MM') === monthYear;
    });
    
    const monthUsage = usage.filter(usage => {
      const usageDate = new Date(usage.date);
      return format(usageDate, 'yyyy-MM') === monthYear;
    });
    
    return monthAccruals.length > 0 || monthUsage.length > 0;
  } catch (error) {
    logger.error(`Error checking TOIL for month for user ${userId}:`, error);
    return false;
  }
};

/**
 * Find TOIL records by original entry ID
 */
export const findTOILRecordsByEntryId = (entryId: string) => {
  try {
    const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
    return allRecords.filter((record: any) => record.entryId === entryId);
  } catch (error) {
    logger.error(`Error finding TOIL records for entry ${entryId}:`, error);
    return [];
  }
};

/**
 * Delete TOIL record by original entry ID
 */
export const deleteTOILRecordByEntryId = async (entryId: string): Promise<boolean> => {
  try {
    const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
    const filteredRecords = allRecords.filter((record: any) => record.entryId !== entryId);
    
    if (filteredRecords.length < allRecords.length) {
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error deleting TOIL record for entry ${entryId}:`, error);
    return false;
  }
};

/**
 * Get TOIL summary for a user in a specific month
 */
export const getTOILSummary = (userId: string, monthYear: string): TOILSummary => {
  try {
    // Try to get from cache first
    const cachedSummary = localStorage.getItem(`${TOIL_SUMMARY_CACHE_KEY}_${userId}_${monthYear}`);
    
    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }
    
    // Calculate from records if no cache
    const records = loadTOILRecords(userId);
    const usage = loadTOILUsage(userId);
    
    const monthAccruals = records.filter(record => {
      return record.monthYear === monthYear;
    });
    
    const monthUsage = usage.filter(usage => {
      return usage.monthYear === monthYear;
    });
    
    const accrued = monthAccruals.reduce((total, record) => total + record.hours, 0);
    const used = monthUsage.reduce((total, usage) => total + usage.hours, 0);
    const remaining = Math.max(0, accrued - used);
    
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the result
    localStorage.setItem(`${TOIL_SUMMARY_CACHE_KEY}_${userId}_${monthYear}`, JSON.stringify(summary));
    
    return summary;
  } catch (error) {
    logger.error(`Error getting TOIL summary for ${userId}, ${monthYear}:`, error);
    return {
      userId,
      monthYear,
      accrued: 0,
      used: 0,
      remaining: 0
    };
  }
};
