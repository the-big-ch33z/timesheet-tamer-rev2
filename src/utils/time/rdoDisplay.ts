
import { Holiday } from "@/lib/holidays";
import { isWeekend, addDays, isSameDay } from "date-fns";
import { createTimeLogger } from "./errors";
import { getWeekDay, getFortnightWeek } from "./scheduleUtils";
import { WorkSchedule } from "@/types";

const logger = createTimeLogger('rdoDisplay');

const MAX_ITERATIONS = 10; // Safety limit to prevent infinite loops

/**
 * Check if a date is a holiday
 */
const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return isSameDay(holidayDate, date);
  });
};

/**
 * Find the next available business day (not weekend, not holiday)
 * Now checks the current day first before moving to next days
 */
export const findNextBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let currentDate = new Date(date);
  let iterations = 0;
  
  // Keep track of processed dates to detect cycles
  const processedDates = new Set<string>();
  
  // First check if current date is already valid
  if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
    return currentDate;
  }
  
  while (iterations < MAX_ITERATIONS) {
    currentDate = addDays(currentDate, 1);
    const dateKey = currentDate.toISOString();
    
    if (processedDates.has(dateKey)) {
      logger.warn(`Cycle detected while finding next business day after ${date.toISOString()}`);
      break;
    }
    
    processedDates.add(dateKey);
    
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      logger.debug(`Found next business day: ${currentDate.toISOString()} for date: ${date.toISOString()}`);
      return currentDate;
    }
    
    iterations++;
  }
  
  logger.warn(`Max iterations (${MAX_ITERATIONS}) reached while finding next business day`);
  return currentDate;
};

/**
 * Check if this day needs RDO shifting (due to weekend or holiday)
 */
export const needsRdoShift = (date: Date, holidays: Holiday[]): boolean => {
  return isWeekend(date) || isHoliday(date, holidays);
};

/**
 * Get the shifted RDO date if it falls on a holiday or weekend
 * Returns information about the shift including original date and reason
 */
export const getShiftedRDODate = (originalDate: Date, holidays: Holiday[]): {
  shifted: Date | null,
  originalDate: Date,
  reason: string | null
} => {
  // Only shift if the date is a holiday or weekend
  if (!needsRdoShift(originalDate, holidays)) {
    return {
      shifted: null,
      originalDate,
      reason: null
    };
  }
  
  const shiftedDate = findNextBusinessDay(originalDate, holidays);
  logger.debug(`Shifting RDO from ${originalDate.toISOString()} to ${shiftedDate.toISOString()}`);
  
  // Double check that the shifted date is valid
  if (isHoliday(shiftedDate, holidays) || isWeekend(shiftedDate)) {
    logger.error(`Invalid shifted date: ${shiftedDate.toISOString()} is still a holiday or weekend`);
    return {
      shifted: null,
      originalDate,
      reason: "Unable to find valid business day"
    };
  }
  
  // Get the reason for the shift
  const shiftReason = getRDOShiftReason(originalDate, shiftedDate, holidays);
  
  return {
    shifted: shiftedDate,
    originalDate,
    reason: shiftReason
  };
};

/**
 * Get details about why an RDO was shifted
 */
export const getRDOShiftReason = (originalDate: Date, shiftedDate: Date | null, holidays: Holiday[]): string => {
  if (!shiftedDate) return '';
  
  const reasons: string[] = [];
  
  if (isWeekend(originalDate)) {
    reasons.push('weekend');
  }
  
  const holiday = holidays.find(h => isSameDay(new Date(h.date), originalDate));
  if (holiday) {
    reasons.push(holiday.name);
  }
  
  if (reasons.length === 0) return '';
  
  const daysDiff = Math.round((shiftedDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
  return `RDO shifted ${daysDiff} day${daysDiff > 1 ? 's' : ''} due to ${reasons.join(' and ')}`;
};

/**
 * Check if any RDOs need to be shifted for a month, and return the mapping
 */
export const getShiftedRDOsForMonth = (
  daysInMonth: Date[],
  workSchedule: WorkSchedule | undefined,
  holidays: Holiday[]
): Map<string, { originalDate: Date, reason: string | null }> => {
  const shiftedRDOMap = new Map<string, { originalDate: Date, reason: string | null }>();
  const shiftedDates = new Set<string>();
  
  // Skip if no work schedule
  if (!workSchedule) return shiftedRDOMap;
  
  // First pass: identify all RDOs and their potential shifts
  daysInMonth.forEach(day => {
    const weekdayName = getWeekDay(day);
    const fortnightWeek = getFortnightWeek(day);
    
    // Check if this is an RDO
    const isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekdayName);
    
    if (isRDO) {
      // Get shift information
      const shiftInfo = getShiftedRDODate(day, holidays);
      
      if (shiftInfo.shifted) {
        const shiftedKey = shiftInfo.shifted.toISOString().split('T')[0];
        
        // If this shifted date is already taken, try to find the next available date
        let currentShiftedDate = shiftInfo.shifted;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (shiftedDates.has(shiftedKey) && attempts < maxAttempts) {
          attempts++;
          const newShiftInfo = getShiftedRDODate(
            new Date(currentShiftedDate.setDate(currentShiftedDate.getDate() + 1)), 
            holidays
          );
          if (!newShiftInfo.shifted) break;
          currentShiftedDate = newShiftInfo.shifted;
        }
        
        const finalShiftedKey = currentShiftedDate.toISOString().split('T')[0];
        
        // Add to our tracking maps
        shiftedDates.add(finalShiftedKey);
        
        shiftedRDOMap.set(finalShiftedKey, {
          originalDate: day,
          reason: shiftInfo.reason
        });
        
        logger.debug(`RDO mapped: ${day.toISOString()} → ${currentShiftedDate.toISOString()}, reason: ${shiftInfo.reason}`);
      }
    }
  });
  
  return shiftedRDOMap;
};
