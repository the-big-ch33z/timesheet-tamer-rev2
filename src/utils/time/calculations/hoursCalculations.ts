
/**
 * Hours calculation utilities
 * Functions for calculating hours between times and related operations
 */
import { calculateFortnightHoursFromSchedule, getWorkdaysInMonth } from '../scheduleUtils';
import { WorkSchedule } from '@/types';
import { 
  TimeCalculationError, 
  TimeValidationError,
  validateTimeString, 
  validateNumberInRange,
  createTimeLogger,
  safeCalculation
} from '../errors/timeErrorHandling';

// Create a logger instance for calculations
const logger = createTimeLogger('HoursCalculations');

/**
 * Calculates hours between start and end time
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @returns Number of hours between times
 * @throws TimeCalculationError if time format is invalid or calculation fails
 */
export const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
  try {
    logger.debug(`Calculating hours from times: ${startTime} to ${endTime}`);
    
    // Input validation with our improved validators
    validateTimeString(startTime, 'Start time');
    validateTimeString(endTime, 'End time');
    
    // Parse the time strings into hours and minutes
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Calculate the difference in minutes
    let diffMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle cases where end time is on the next day
    if (diffMinutes < 0) {
      logger.debug("End time appears to be on the next day, adding 24 hours");
      diffMinutes += 24 * 60;
    }
    
    // Convert minutes to hours with 1 decimal place
    const hours = Math.round(diffMinutes / 6) / 10;
    logger.debug(`Calculated hours: ${hours}`);
    return hours;
  } catch (error) {
    // Handle and rethrow with better context
    if (error instanceof TimeCalculationError) {
      logger.error(`Failed to calculate hours: ${error.message}`, error);
      throw error;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error calculating hours: ${message}`, error);
      throw new TimeCalculationError(`Failed to calculate hours between ${startTime} and ${endTime}: ${message}`);
    }
  }
};

/**
 * Calculate monthly target hours based on fortnight hours
 * @param fortnightHours Hours for a fortnight
 * @param workDaysInMonth Number of work days in the month (or actual date)
 * @returns Target hours for the month
 * @throws TimeCalculationError if inputs are invalid
 */
export const calculateMonthlyTargetHours = (fortnightHours: number, monthOrWorkDays: Date | number): number => {
  try {
    // Input validation
    validateNumberInRange(fortnightHours, 'Fortnight hours', 0, 168);
    
    // If we received a Date, get the work days in that month
    let workDaysInMonth: number;
    if (monthOrWorkDays instanceof Date) {
      workDaysInMonth = getWorkdaysInMonth(monthOrWorkDays);
      logger.debug(`Calculated ${workDaysInMonth} workdays in month ${monthOrWorkDays.toISOString().substr(0, 7)}`);
    } else {
      workDaysInMonth = monthOrWorkDays;
      validateNumberInRange(workDaysInMonth, 'Work days in month', 0, 31);
    }
    
    const fortnightWorkDays = 10; // Standard number of work days in a fortnight
    
    // Calculate target hours proportionally
    const targetHours = (workDaysInMonth / fortnightWorkDays) * fortnightHours;
    
    // Round to 1 decimal place
    const roundedHours = Math.round(targetHours * 10) / 10;
    logger.debug(`Calculated monthly target hours: ${roundedHours} (from ${fortnightHours} fortnight hours and ${workDaysInMonth} work days)`);
    
    return roundedHours;
  } catch (error) {
    // Handle and rethrow with better context
    if (error instanceof TimeCalculationError) {
      logger.error(`Failed to calculate monthly target hours: ${error.message}`, error);
      throw error;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error calculating monthly target hours: ${message}`, error);
      throw new TimeCalculationError(
        `Failed to calculate monthly target hours from ${fortnightHours} fortnight hours: ${message}`
      );
    }
  }
};

/**
 * Calculate adjusted fortnight hours based on work schedule and FTE
 * @param workSchedule The work schedule
 * @param userFte User's full-time equivalent value (0-1)
 * @returns Adjusted fortnight hours
 * @throws TimeCalculationError if inputs are invalid
 */
export const calculateAdjustedFortnightHours = (
  workSchedule?: WorkSchedule, 
  userFte: number = 1.0
): number => {
  try {
    // Check if work schedule exists
    if (!workSchedule) {
      logger.warn("No work schedule provided, returning 0 hours");
      return 0;
    }
    
    // Validate FTE
    validateNumberInRange(userFte, 'Full-time equivalent (FTE)', 0, 2);
    
    // Calculate fortnight hours based on the schedule
    const scheduleHours = calculateFortnightHoursFromSchedule(workSchedule);
    logger.debug(`Base fortnight hours from schedule: ${scheduleHours}`);
    
    // Apply FTE to the schedule hours if user has an FTE set
    if (userFte !== 1.0 && userFte > 0) {
      const adjustedHours = scheduleHours * userFte;
      logger.debug(`Applied FTE ${userFte} to get ${adjustedHours} adjusted hours`);
      return adjustedHours;
    }
    
    return scheduleHours;
  } catch (error) {
    // Handle and rethrow with better context
    if (error instanceof TimeCalculationError) {
      logger.error(`Failed to calculate adjusted fortnight hours: ${error.message}`, error);
      throw error;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error calculating adjusted fortnight hours: ${message}`, error);
      throw new TimeCalculationError(
        `Failed to calculate adjusted fortnight hours with FTE ${userFte}: ${message}`
      );
    }
  }
};
