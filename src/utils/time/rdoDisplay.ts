import { Holiday } from "@/lib/holidays";
import { isWeekend, addDays, isSameDay } from "date-fns";
import { createTimeLogger } from "./errors";

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
 * Now handles consecutive holidays and weekends correctly
 */
export const findNextBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let currentDate = date;
  let iterations = 0;
  
  // Keep track of processed dates to detect cycles
  const processedDates = new Set<string>();
  
  while (iterations < MAX_ITERATIONS) {
    currentDate = addDays(currentDate, 1);
    const dateKey = currentDate.toISOString();
    
    // Check for cycles
    if (processedDates.has(dateKey)) {
      logger.warn(`Cycle detected while finding next business day after ${date.toISOString()}`);
      break;
    }
    
    processedDates.add(dateKey);
    
    // Check if current date is valid
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
 * Get the shifted RDO date if it falls on a holiday
 * Enhanced with better logging and validation
 */
export const getShiftedRDODate = (originalDate: Date, holidays: Holiday[]): Date | null => {
  if (!isHoliday(originalDate, holidays)) {
    return null;
  }
  
  const shiftedDate = findNextBusinessDay(originalDate, holidays);
  logger.debug(`Shifting RDO from ${originalDate.toISOString()} to ${shiftedDate.toISOString()}`);
  
  // Validate the shifted date
  if (isHoliday(shiftedDate, holidays) || isWeekend(shiftedDate)) {
    logger.error(`Invalid shifted date: ${shiftedDate.toISOString()} is still a holiday or weekend`);
    return null;
  }
  
  return shiftedDate;
};

/**
 * Get details about why an RDO was shifted
 */
export const getRDOShiftReason = (originalDate: Date, shiftedDate: Date | null, holidays: Holiday[]): string => {
  if (!shiftedDate) return '';
  
  const holiday = holidays.find(h => isSameDay(new Date(h.date), originalDate));
  if (!holiday) return '';
  
  const daysDiff = Math.round((shiftedDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
  return `RDO shifted ${daysDiff} day${daysDiff > 1 ? 's' : ''} due to ${holiday.name}`;
};
