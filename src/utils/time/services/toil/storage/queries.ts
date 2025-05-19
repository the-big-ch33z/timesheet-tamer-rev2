
import { format } from "date-fns";
import { TOIL_USAGE_KEY, TOIL_RECORDS_KEY } from "./constants";
import { createTimeLogger } from "@/utils/time/errors";
import { safelyParseJSON } from "./utils";
import { TOILRecord, TOILUsage } from "@/types/toil";

const logger = createTimeLogger('TOIL-Storage-Queries');

/**
 * Information about TOIL for a specific day
 */
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

/**
 * Checks if a user has TOIL records or usage for a specific day
 * 
 * @param userId - User ID to check
 * @param date - Date to check
 * @returns Object with hasAccrued, hasUsed flags and toilHours total
 */
export function hasTOILForDay(userId: string, date: Date): TOILDayInfo {
  try {
    const dateKey = format(date, 'yyyy-MM-dd');
    const rawRecords = localStorage.getItem(TOIL_RECORDS_KEY) || '[]';
    const rawUsage = localStorage.getItem(TOIL_USAGE_KEY) || '[]';
    
    // Parse records and filter for this user and date
    const records: TOILRecord[] = safelyParseJSON(rawRecords, []);
    const usage: TOILUsage[] = safelyParseJSON(rawUsage, []);
    
    // Check for accruement records
    const userRecords = records.filter(record => 
      record.userId === userId && 
      format(new Date(record.date), 'yyyy-MM-dd') === dateKey
    );
    
    // Check for usage records
    const userUsage = usage.filter(use => 
      use.userId === userId && 
      format(new Date(use.date), 'yyyy-MM-dd') === dateKey
    );
    
    // Calculate total TOIL hours for this day
    const totalToilHours = userRecords.reduce((sum, record) => sum + record.hours, 0);
    
    return {
      hasAccrued: userRecords.length > 0,
      hasUsed: userUsage.length > 0,
      toilHours: totalToilHours
    };
  } catch (error) {
    logger.error(`Error checking TOIL for day: ${error instanceof Error ? error.message : String(error)}`);
    return {
      hasAccrued: false,
      hasUsed: false,
      toilHours: 0
    };
  }
}

// Export other query functions as needed
