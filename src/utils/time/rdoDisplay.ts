
import { Holiday } from "@/lib/holidays";
import { isWeekend } from "date-fns";
import { addDays } from "date-fns";
import { createTimeLogger } from "./errors";

const logger = createTimeLogger('rdoDisplay');

/**
 * Check if a date is a holiday
 */
const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toDateString() === date.toDateString();
  });
};

/**
 * Find the next available business day (not weekend, not holiday)
 */
export const findNextBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let nextDate = addDays(date, 1);
  
  while (isWeekend(nextDate) || isHoliday(nextDate, holidays)) {
    nextDate = addDays(nextDate, 1);
  }
  
  return nextDate;
};

/**
 * Get the shifted RDO date if it falls on a holiday
 */
export const getShiftedRDODate = (originalDate: Date, holidays: Holiday[]): Date | null => {
  if (!isHoliday(originalDate, holidays)) {
    return null;
  }
  
  const shiftedDate = findNextBusinessDay(originalDate, holidays);
  logger.debug(`Shifting RDO from ${originalDate.toDateString()} to ${shiftedDate.toDateString()}`);
  
  return shiftedDate;
};
