
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { loadTOILRecords, loadTOILUsage } from "./core";

const logger = createTimeLogger('TOIL-Storage-Queries');

/**
 * Information about TOIL status for a specific day
 */
export interface TOILDayInfo {
  hasToil: boolean;
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

/**
 * Check if there is TOIL for a specific day
 * 
 * @param userId User ID
 * @param date Date to check
 * @returns TOILDayInfo with details about TOIL for the day
 */
export function hasTOILForDay(userId: string, date: Date): TOILDayInfo {
  try {
    const dayString = format(date, 'yyyy-MM-dd');
    logger.debug(`Checking TOIL for ${userId} on ${dayString}`);
    
    // Check for TOIL accrual records
    const records = loadTOILRecords(userId);
    const dayRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return format(recordDate, 'yyyy-MM-dd') === dayString;
    });
    
    // Check for TOIL usage records
    const usageRecords = loadTOILUsage(userId);
    const dayUsage = usageRecords.filter(usage => {
      const usageDate = new Date(usage.date);
      return format(usageDate, 'yyyy-MM-dd') === dayString;
    });
    
    // Calculate total TOIL hours for the day
    const accrualHours = dayRecords.reduce((sum, record) => sum + record.hours, 0);
    const usageHours = dayUsage.reduce((sum, usage) => sum + usage.hours, 0);
    const netHours = accrualHours - usageHours;
    
    return {
      hasToil: dayRecords.length > 0 || dayUsage.length > 0,
      hasAccrued: dayRecords.length > 0 && accrualHours > 0,
      hasUsed: dayUsage.length > 0 && usageHours > 0,
      toilHours: netHours
    };
  } catch (error) {
    logger.error(`Error checking TOIL for day: ${error instanceof Error ? error.message : String(error)}`);
    return {
      hasToil: false,
      hasAccrued: false,
      hasUsed: false,
      toilHours: 0
    };
  }
}
