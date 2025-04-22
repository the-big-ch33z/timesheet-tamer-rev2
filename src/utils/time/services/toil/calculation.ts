
import { TimeEntry, WorkSchedule } from "@/types";
import { TOILRecord, TOILSummary } from "@/types/toil";
import { v4 as uuidv4 } from "uuid";
import { format } from 'date-fns';
import { isNonWorkingDay } from "@/utils/time/scheduleUtils";
import { getWeekDay, getFortnightWeek, calculateDayHours } from "@/utils/time/scheduleUtils";
import { isValidTOILHours, getSanitizedTOILHours } from "@/utils/time/validation/toilValidation";
import { Holiday } from "@/lib/holidays";
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILCalculation');

/**
 * Calculate TOIL hours based on entries, schedule, and holidays
 */
export function calculateTOILHours(
  entries: TimeEntry[], 
  date: Date, 
  workSchedule?: WorkSchedule,
  holidays: Holiday[] = []
): number {
  try {
    // Guard against empty entries
    if (!entries || entries.length === 0) {
      logger.debug('[TOILCalc] No entries found, returning 0 TOIL hours');
      return 0;
    }
    
    // Guard against missing work schedule
    if (!workSchedule) {
      logger.debug('[TOILCalc] No work schedule provided, returning 0 TOIL hours');
      return 0;
    }

    // First step: check if the date is a non-working day
    // This optimization prevents unnecessary calculations
    const isNonWorking = isNonWorkingDay(date, workSchedule, holidays);

    // Calculate actual hours from entries, but only count entries for the same date
    const actualHours = entries
      .filter(entry => {
        if (!entry.date) return false;
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return format(entryDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      })
      .reduce((sum, entry) => {
        // Validate hours before adding
        const hours = isFinite(entry.hours) ? entry.hours : 0;
        return hours > 0 ? sum + hours : sum;
      }, 0);

    // Guard against zero actual hours
    if (actualHours <= 0) {
      logger.debug('[TOILCalc] No actual hours worked, returning 0 TOIL hours');
      return 0;
    }

    let toilHours = 0;
    
    // If it's a non-working day, all hours count as TOIL
    if (isNonWorking) {
      toilHours = actualHours;
      logger.debug(`[TOILCalc] Non-working day detected, all ${actualHours}h count as TOIL`);
    } else {
      // For working days, calculate excess hours as before
      const weekDay = getWeekDay(date);
      const weekNum = getFortnightWeek(date);
      const daySchedule = workSchedule?.weeks[weekNum][weekDay];
      
      if (daySchedule?.startTime && daySchedule?.endTime) {
        const scheduledHours = calculateDayHours(
          daySchedule.startTime,
          daySchedule.endTime,
          daySchedule.breaks
        );
        toilHours = Math.max(0, actualHours - scheduledHours);
        logger.debug(`[TOILCalc] Working day: actual=${actualHours}h, scheduled=${scheduledHours}h, TOIL=${toilHours}h`);
      }
    }

    // ENFORCE positive, valid, clamped TOIL hours
    if (!isValidTOILHours(toilHours)) {
      logger.debug('[TOILCalc] Invalid TOIL hours calculated:', toilHours);
      toilHours = 0;
    } else {
      toilHours = getSanitizedTOILHours(toilHours);
    }

    logger.debug(`[TOILCalc] Final TOIL hours calculated: ${toilHours}`);
    return toilHours;
  } catch (error) {
    logger.error('[TOILCalc] Error calculating TOIL hours:', error);
    return 0;
  }
}

/**
 * Create a TOIL record object
 */
export function createTOILRecord(
  userId: string,
  date: Date,
  hours: number,
  entryId?: string
): TOILRecord {
  const monthYear = format(date, 'yyyy-MM');
  
  return {
    id: uuidv4(),
    userId,
    date,
    hours: getSanitizedTOILHours(hours),
    monthYear,
    entryId,
    status: 'active'
  };
}
