
import { TOILRecord, TOILSummary } from "@/types/toil";
import { format, isSameDay } from "date-fns";
import { createTimeLogger } from '@/utils/time/errors';
import { loadTOILRecords, loadTOILUsage, TOIL_SUMMARY_CACHE_KEY } from './core';

const logger = createTimeLogger('TOILQueries');

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

// Get TOIL records for a specific day
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

// Check if a day has TOIL accrued or used
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
