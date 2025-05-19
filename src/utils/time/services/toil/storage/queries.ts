
import { TOILRecord, TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { format } from "date-fns";
import { 
  loadTOILRecords, 
  loadTOILUsage, 
  filterRecordsByMonth,
  filterRecordsByEntryId,
  getSummaryCacheKey
} from "./core";

const logger = createTimeLogger('TOIL-Storage-Queries');

/**
 * Type representing TOIL information for a specific day
 */
export interface TOILDayInfo {
  date: Date;
  hours: number;
  status: 'active' | 'expired' | 'used';
}

/**
 * Get all TOIL records for a specific user
 */
export function getUserTOILRecords(userId: string): TOILRecord[] {
  try {
    const records = loadTOILRecords(userId);
    return records;
  } catch (error) {
    logger.error(`Error getting TOIL records for user ${userId}:`, error);
    return [];
  }
}

/**
 * Find TOIL records by entry ID
 */
export function findTOILRecordsByEntryId(entryId: string): TOILRecord[] {
  try {
    const allRecords = loadTOILRecords();
    return filterRecordsByEntryId(allRecords, entryId);
  } catch (error) {
    logger.error(`Error finding TOIL records for entry ${entryId}:`, error);
    return [];
  }
}

/**
 * Delete TOIL records by entry ID
 * @deprecated Use deleteTOILRecordsByEntryId instead
 */
export async function deleteTOILRecordByEntryId(entryId: string): Promise<boolean> {
  try {
    logger.warn(`deleteTOILRecordByEntryId is deprecated, use deleteTOILRecordsByEntryId instead`);
    return true;
  } catch (error) {
    logger.error(`Error deleting TOIL record for entry ${entryId}:`, error);
    return false;
  }
}

/**
 * Get TOIL summary for a user and month
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary {
  try {
    // Check if we have a cached summary
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    const cachedSummary = localStorage.getItem(cacheKey);
    
    if (cachedSummary) {
      try {
        const summary = JSON.parse(cachedSummary) as TOILSummary;
        return summary;
      } catch (error) {
        logger.error(`Error parsing cached TOIL summary:`, error);
        // Continue to recalculate if parsing fails
      }
    }
    
    // Calculate summary from records
    const allRecords = loadTOILRecords(userId);
    const allUsage = loadTOILUsage(userId);
    
    // Filter records for this month
    const monthRecords = filterRecordsByMonth(allRecords, monthYear);
    const monthUsage = allUsage.filter(usage => usage.monthYear === monthYear);
    
    // Calculate totals
    const accrued = monthRecords.reduce((sum, record) => sum + record.hours, 0);
    const used = monthUsage.reduce((sum, usage) => sum + usage.hours, 0);
    const remaining = Math.max(0, accrued - used);
    
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued,
      used,
      remaining
    };
    
    // Cache the summary
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    return summary;
  } catch (error) {
    logger.error(`Error getting TOIL summary for ${userId}:`, error);
    
    // Return a safe default
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
 * Check if a user has any TOIL for a specific day
 */
export function hasTOILForDay(userId: string, date: Date): boolean {
  try {
    const dateString = format(date, 'yyyy-MM-dd');
    const records = loadTOILRecords(userId);
    
    return records.some(record => {
      const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
      return recordDate === dateString;
    });
  } catch (error) {
    logger.error(`Error checking TOIL for day:`, error);
    return false;
  }
}

/**
 * Check if a user has any TOIL for a specific month
 */
export function hasTOILForMonth(userId: string, monthYear: string): boolean {
  try {
    const records = loadTOILRecords(userId);
    const monthRecords = filterRecordsByMonth(records, monthYear);
    
    return monthRecords.length > 0;
  } catch (error) {
    logger.error(`Error checking TOIL for month:`, error);
    return false;
  }
}
