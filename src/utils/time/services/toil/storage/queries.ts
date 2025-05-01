
import { TOILRecord } from "@/types/toil";
import { format, isSameDay } from "date-fns";
import { loadTOILRecords, loadTOILUsage } from './core';
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILQueries');

// Get all TOIL records for a specific user
export function getUserTOILRecords(userId: string): TOILRecord[] {
  const allRecords = loadTOILRecords();
  return allRecords.filter(record => record.userId === userId);
}

// Check if a user has TOIL records for a specific day
export function hasTOILForDay(userId: string, date: Date): { 
  hasAccrued: boolean; 
  hasUsed: boolean;
  toilHours: number;
} {
  if (!userId || !date) {
    return { hasAccrued: false, hasUsed: false, toilHours: 0 };
  }
  
  try {
    // Load all records and usage
    const records = loadTOILRecords();
    const usage = loadTOILUsage();
    
    // Find records for this day
    const dayToilRecords = records.filter(record => 
      record.userId === userId && 
      isSameDay(new Date(record.date), date)
    );
    
    // Find usage for this day
    const dayToilUsage = usage.filter(usage => 
      usage.userId === userId && 
      isSameDay(new Date(usage.date), date)
    );
    
    // Sum up hours for this day
    const accruedHours = dayToilRecords.reduce((sum, record) => sum + record.hours, 0);
    const usedHours = dayToilUsage.reduce((sum, usage) => sum + usage.hours, 0);
    
    return { 
      hasAccrued: dayToilRecords.length > 0, 
      hasUsed: dayToilUsage.length > 0,
      toilHours: Math.max(accruedHours, usedHours)
    };
  } catch (error) {
    logger.error('Error checking TOIL for day:', error);
    return { hasAccrued: false, hasUsed: false, toilHours: 0 };
  }
}

// Find TOIL records by entry ID
export function findTOILRecordsByEntryId(entryId: string): TOILRecord[] {
  if (!entryId) return [];
  
  const allRecords = loadTOILRecords();
  return allRecords.filter(record => record.entryId === entryId);
}

// Check if a user has any TOIL for a specific month
export function hasTOILForMonth(userId: string, monthYear: string): boolean {
  const records = loadTOILRecords();
  return records.some(record => record.userId === userId && record.monthYear === monthYear);
}
