
import { format } from 'date-fns';
import { loadTOILRecords, loadTOILUsage } from './core';

/**
 * Interface for day-specific TOIL information
 */
export interface TOILDayInfo {
  hasToil: boolean;   // Whether the day has any TOIL (either accrued or used)
  hasAccrued: boolean; // Whether TOIL was accrued on this day
  hasUsed: boolean;   // Whether TOIL was used on this day
  toilHours: number;  // Net TOIL hours for this day
}

/**
 * Check if a user has TOIL records for a specific day
 * @param userId User ID to check
 * @param date Date to check
 * @returns TOILDayInfo with information about TOIL for the day
 */
export function hasTOILForDay(userId: string, date: Date): TOILDayInfo {
  try {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Load TOIL records
    const records = loadTOILRecords(userId);
    const accrualRecords = records.filter(record => 
      format(new Date(record.date), 'yyyy-MM-dd') === dateKey
    );
    
    // Load TOIL usage
    const usageRecords = loadTOILUsage(userId);
    const usageForDay = usageRecords.filter(usage => 
      format(new Date(usage.date), 'yyyy-MM-dd') === dateKey
    );
    
    // Calculate hours based on records
    const accrued = accrualRecords.reduce((sum, record) => sum + record.hours, 0);
    const used = usageForDay.reduce((sum, usage) => sum + usage.hours, 0);
    
    return {
      hasToil: accrualRecords.length > 0 || usageForDay.length > 0,
      hasAccrued: accrualRecords.length > 0,
      hasUsed: usageForDay.length > 0,
      toilHours: accrued - used
    };
  } catch (error) {
    console.error('Error checking TOIL for day:', error);
    return { 
      hasToil: false,
      hasAccrued: false, 
      hasUsed: false, 
      toilHours: 0 
    };
  }
}
