
import { TimeCalculationError } from '../errors/timeErrorHandling';
import { WorkSchedule, WeekDay } from "@/types";
import { getWorkdaysInMonth, getFortnightWeek } from "../scheduleUtils";
import { eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { calculateFortnightHoursFromSchedule } from "../scheduleUtils";

/**
 * Calculate hours difference between two time strings (HH:MM format)
 * Improved with robust time format handling to prevent errors
 */
export const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;

  try {
    // Normalize time format to ensure HH:MM
    const normalizedStart = normalizeTimeFormat(start);
    const normalizedEnd = normalizeTimeFormat(end);
    
    if (!normalizedStart || !normalizedEnd) {
      throw new Error('Invalid time format after normalization');
    }

    // Parse hours and minutes from normalized time strings
    const [startHour, startMinute] = normalizedStart.split(':').map(Number);
    const [endHour, endMinute] = normalizedEnd.split(':').map(Number);

    // Ensure we have valid numbers
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      throw new Error('Invalid time format');
    }

    // Convert to decimal hours
    const startDecimal = startHour + (startMinute / 60);
    let endDecimal = endHour + (endMinute / 60);

    // Handle overnight shifts by adding 24 hours to end time if it's before start time
    if (endDecimal < startDecimal) {
      endDecimal += 24;
    }

    // Calculate difference to get total hours worked
    const rawHours = endDecimal - startDecimal;
    
    // Round to nearest 0.25 (15 mins)
    const roundedHours = Math.round(rawHours * 4) / 4;

    return roundedHours;
  } catch (error) {
    console.error("Error calculating hours from times:", error);
    throw new TimeCalculationError(`Failed to calculate hours from ${start} to ${end}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Normalize time input to ensure HH:MM format
 * Handles various input formats like "9:00", "09:00", "9", etc.
 */
function normalizeTimeFormat(timeString: string): string | null {
  if (!timeString) return null;
  
  // If already in HH:MM format, return as is
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    // Ensure hours are two digits
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // If just a number (like "9"), convert to HH:00 format
  if (/^\d{1,2}$/.test(timeString)) {
    return `${timeString.padStart(2, '0')}:00`;
  }
  
  // Other formats not supported
  return null;
}

/**
 * Count RDO days in a given month based on the work schedule
 */
export const countRdoDaysInMonth = (month: Date, workSchedule?: WorkSchedule): number => {
  if (!workSchedule) return 0;
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  let rdoCount = 0;
  
  daysInMonth.forEach(day => {
    const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()] as WeekDay;
    const fortnightWeek = getFortnightWeek(day);
    
    if (workSchedule.rdoDays[fortnightWeek].includes(weekdayName)) {
      rdoCount++;
    }
  });
  
  return rdoCount;
};

/**
 * Calculate monthly target hours based on fortnightly hours 
 * @param fortnightHours Hours per fortnight (10 working days)
 * @param month Date in the target month
 * @param workSchedule Optional work schedule to consider RDO days
 * @returns Target hours for the month
 */
export const calculateMonthlyTargetHours = (
  fortnightHours: number, 
  month: Date,
  workSchedule?: WorkSchedule
): number => {
  try {
    if (fortnightHours < 0) {
      throw new TimeCalculationError(`Invalid fortnight hours: ${fortnightHours}`);
    }

    let workdaysInMonth = getWorkdaysInMonth(month);
    
    // Deduct RDO days if we have a work schedule
    if (workSchedule) {
      const rdoDays = countRdoDaysInMonth(month, workSchedule);
      workdaysInMonth = Math.max(0, workdaysInMonth - rdoDays);
    }
    
    // Standard fortnight has 10 workdays
    const standardFortnightDays = 10;
    
    // Calculate based on ratio of actual workdays to standard fortnight
    const targetHours = fortnightHours * (workdaysInMonth / standardFortnightDays);
    
    return Math.round(targetHours * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    if (error instanceof TimeCalculationError) {
      throw error;
    }
    throw new TimeCalculationError(
      `Failed to calculate monthly target hours: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Calculate adjusted fortnight hours based on work schedule and FTE
 * @param workSchedule Work schedule
 * @param fte Full-time equivalent value (0.0 - 2.0)
 */
export const calculateAdjustedFortnightHours = (
  workSchedule?: WorkSchedule,
  fte: number = 1.0
): number => {
  try {
    // Validate FTE
    if (fte < 0 || fte > 2) {
      throw new TimeCalculationError(`Invalid FTE: ${fte}. Must be between 0 and 2.`);
    }
    
    // Early return if no schedule
    if (!workSchedule) return 0;
    
    // Calculate base fortnight hours from schedule
    const baseFortnightHours = calculateFortnightHoursFromSchedule(workSchedule);
    
    // Apply FTE adjustment
    const adjustedHours = baseFortnightHours * fte;
    
    // Round to 1 decimal place
    return Math.round(adjustedHours * 10) / 10;
  } catch (error) {
    if (error instanceof TimeCalculationError) {
      throw error;
    }
    
    throw new TimeCalculationError(
      `Failed to calculate adjusted fortnight hours: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Re-export the function from scheduleUtils for convenience
export { calculateFortnightHoursFromSchedule };
