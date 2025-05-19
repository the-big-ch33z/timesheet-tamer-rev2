
import { TOILRecord, TOILSummary } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';
import {
  loadTOILRecords,
  filterRecordsByMonth,
  filterRecordsByDate,
  filterRecordsByEntryId,
  getSummaryCacheKey
} from './core';

const logger = createTimeLogger('TOILQueries');

// Add the missing TOILDayInfo type
export interface TOILDayInfo {
  date: string;
  hours: number;
  status: 'active' | 'expired' | 'used';
}

/**
 * Get all TOIL records for a specific user
 */
export function getUserTOILRecords(userId: string): TOILRecord[] {
  return loadTOILRecords(userId);
}

/**
 * Find TOIL records associated with a specific time entry
 */
export function findTOILRecordsByEntryId(entryId: string): TOILRecord[] {
  const allRecords = loadTOILRecords();
  return filterRecordsByEntryId(allRecords, entryId);
}

/**
 * Delete a TOIL record associated with a specific time entry
 * @deprecated Use deleteTOILRecordsByEntryId instead
 */
export function deleteTOILRecordByEntryId(entryId: string): boolean {
  try {
    logger.warn('deleteTOILRecordByEntryId is deprecated, use deleteTOILRecordsByEntryId instead');
    const allRecords = loadTOILRecords();
    const filteredRecords = allRecords.filter(record => record.entryId !== entryId);
    
    // Check if any records were removed
    if (filteredRecords.length === allRecords.length) {
      return false;
    }
    
    localStorage.setItem('toil_records', JSON.stringify(filteredRecords));
    return true;
  } catch (error) {
    logger.error('Failed to delete TOIL record by entry ID:', error);
    return false;
  }
}

/**
 * Get a TOIL summary for a specific user and month
 */
export function getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
  try {
    logger.debug(`Getting TOIL summary for ${userId}, ${monthYear}`);
    
    // Check for cached summary
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    const cachedSummary = localStorage.getItem(cacheKey);
    
    if (cachedSummary) {
      logger.debug('Found cached TOIL summary');
      return JSON.parse(cachedSummary);
    }
    
    // No cached summary, calculate from records
    const userRecords = getUserTOILRecords(userId);
    const monthRecords = filterRecordsByMonth(userRecords, monthYear);
    
    const accrued = monthRecords.reduce((sum, record) => sum + record.hours, 0);
    
    // Get usage
    const usageJson = localStorage.getItem('toil_usage');
    const allUsage = usageJson ? JSON.parse(usageJson) : [];
    const userUsage = allUsage.filter((usage: any) => usage.userId === userId);
    const monthUsage = filterRecordsByMonth(userUsage, monthYear);
    
    const used = monthUsage.reduce((sum: number, usage: any) => sum + usage.hours, 0);
    
    // Calculate remaining
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
    logger.error('Error getting TOIL summary:', error);
    return null;
  }
}

/**
 * Check if a user has TOIL records for a specific day
 */
export function hasTOILForDay(userId: string, date: Date): boolean {
  try {
    const records = getUserTOILRecords(userId);
    const dayRecords = filterRecordsByDate(records, date);
    return dayRecords.length > 0;
  } catch (error) {
    logger.error('Error checking for TOIL on day:', error);
    return false;
  }
}

/**
 * Check if a user has TOIL records for a specific month
 */
export function hasTOILForMonth(userId: string, monthYear: string): boolean {
  try {
    const records = getUserTOILRecords(userId);
    const monthRecords = filterRecordsByMonth(records, monthYear);
    return monthRecords.length > 0;
  } catch (error) {
    logger.error('Error checking for TOIL in month:', error);
    return false;
  }
}
