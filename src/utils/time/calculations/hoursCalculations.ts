
import { calculateFortnightHoursFromSchedule } from "../scheduleUtils";
import { TimeCalculationError } from "../errors/timeErrorHandling";
import { getWorkdaysInMonth, getFortnightWeek } from "../scheduleUtils";
import { WorkSchedule, WeekDay } from "@/types";
import { eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

/**
 * Calculate hours difference between two time strings (HH:MM format)
 */
export const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;

  // Parse hours and minutes from time strings
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  // Convert to decimal hours
  const startDecimal = startHour + (startMinute / 60);
  const endDecimal = endHour + (endMinute / 60);

  // Ensure end time is after start time
  if (startDecimal >= endDecimal) {
    throw new Error('End time must be after start time');
  }

  // Calculate difference and round to nearest 0.25
  const rawHours = endDecimal - startDecimal;
  const roundedHours = Math.round(rawHours * 4) / 4;

  return roundedHours;
};

/**
 * Count RDO days in a given month based on the work schedule
 * @param month Date in the target month
 * @param workSchedule The work schedule to check
 * @returns Number of RDO days in the month
 */
export const countRdoDaysInMonth = (month: Date, workSchedule?: WorkSchedule): number => {
  if (!workSchedule) return 0;
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  let rdoCount = 0;
  
  // Check each day in the month
  daysInMonth.forEach(day => {
    const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()] as WeekDay;
    const fortnightWeek = getFortnightWeek(day);
    
    // Count as RDO if it's in the RDO days for this fortnight week
    if (workSchedule.rdoDays[fortnightWeek].includes(weekdayName)) {
      rdoCount++;
    }
  });
  
  return rdoCount;
};

/**
 * Calculate monthly target hours based on fortnightly hours 
 * @param fortnightHours Hours per fortnight (10 working days)
 * @param dateOrWorkdays Date or number of workdays in month
 * @param workSchedule Optional work schedule to consider RDO days
 * @returns Target hours for the month
 */
export const calculateMonthlyTargetHours = (
  fortnightHours: number, 
  dateOrWorkdays: Date | number,
  workSchedule?: WorkSchedule
): number => {
  try {
    // Validate fortnightly hours
    if (fortnightHours < 0) {
      throw new TimeCalculationError(`Invalid fortnight hours: ${fortnightHours}. Must be a positive number.`);
    }

    // Calculate number of workdays
    let workdaysInMonth: number;
    let month: Date | null = null;
    
    if (dateOrWorkdays instanceof Date) {
      // If we were given a date, calculate workdays in that month
      workdaysInMonth = getWorkdaysInMonth(dateOrWorkdays);
      month = dateOrWorkdays;
    } else if (typeof dateOrWorkdays === 'number') {
      // If we were given a number directly, use that
      workdaysInMonth = dateOrWorkdays;
    } else {
      throw new TimeCalculationError('Invalid date or workdays parameter');
    }
    
    // Validate workdays
    if (workdaysInMonth < 1) {
      throw new TimeCalculationError(`Invalid number of workdays: ${workdaysInMonth}`);
    }

    if (workdaysInMonth > 31) {
      throw new TimeCalculationError(`Too many workdays specified: ${workdaysInMonth}`);
    }
    
    // Deduct RDO days if we have a work schedule and a month date
    let rdoDays = 0;
    if (workSchedule && month) {
      rdoDays = countRdoDaysInMonth(month, workSchedule);
      
      // Deduct RDO days from workdays count
      if (rdoDays > 0) {
        workdaysInMonth = Math.max(0, workdaysInMonth - rdoDays);
      }
    }
    
    // Standard fortnight has 10 workdays
    const standardFortnightDays = 10;
    
    // Calculate based on ratio between actual workdays and standard fortnight
    const targetHours = fortnightHours * (workdaysInMonth / standardFortnightDays);
    
    // Round to single decimal place
    return Math.round(targetHours * 10) / 10;
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
