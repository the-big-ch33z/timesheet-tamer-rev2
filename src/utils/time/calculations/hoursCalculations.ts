
/**
 * Hours calculation utilities
 * Functions for calculating hours between times and related operations
 */
import { calculateFortnightHoursFromSchedule } from '../scheduleUtils';
import { WorkSchedule } from '@/types';
import { useLogger } from '@/hooks/useLogger';

// Create a logger instance for calculations
const logger = {
  error: (message: string, error?: any) => console.error(`[TimeCalculations] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[TimeCalculations] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[TimeCalculations] ${message}`, data)
};

/**
 * Validates time string format (HH:MM)
 * @param timeStr Time string to validate
 * @returns True if valid, false otherwise
 */
const isValidTimeFormat = (timeStr: string): boolean => {
  if (!timeStr) return false;
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
};

/**
 * Calculates hours between start and end time
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @returns Number of hours between times
 * @throws Error if time format is invalid
 */
export const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
  try {
    logger.debug(`Calculating hours from times: ${startTime} to ${endTime}`);
    
    // Input validation
    if (!startTime || !endTime) {
      throw new Error("Start time and end time must be provided");
    }
    
    if (!isValidTimeFormat(startTime)) {
      throw new Error(`Invalid start time format: ${startTime}. Expected HH:MM format.`);
    }
    
    if (!isValidTimeFormat(endTime)) {
      throw new Error(`Invalid end time format: ${endTime}. Expected HH:MM format.`);
    }
    
    // Parse the time strings into hours and minutes
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Additional validation for parsed values
    if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
      throw new Error("Failed to parse time components");
    }
    
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
    logger.error("Error calculating hours from times:", error);
    // Rethrow with more context if it's not already an Error object
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to calculate hours: ${error}`);
    }
  }
};

/**
 * Calculate monthly target hours based on fortnight hours
 * @param fortnightHours Hours for a fortnight
 * @param workDaysInMonth Number of work days in the month
 * @returns Target hours for the month
 * @throws Error if inputs are invalid
 */
export const calculateMonthlyTargetHours = (fortnightHours: number, workDaysInMonth: number): number => {
  try {
    // Input validation
    if (isNaN(fortnightHours) || fortnightHours < 0) {
      throw new Error(`Invalid fortnight hours: ${fortnightHours}. Must be a non-negative number.`);
    }
    
    if (isNaN(workDaysInMonth) || workDaysInMonth < 0) {
      throw new Error(`Invalid work days in month: ${workDaysInMonth}. Must be a non-negative number.`);
    }
    
    const fortnightWorkDays = 10; // Standard number of work days in a fortnight
    
    // Calculate target hours proportionally
    const targetHours = (workDaysInMonth / fortnightWorkDays) * fortnightHours;
    
    // Round to 1 decimal place
    const roundedHours = Math.round(targetHours * 10) / 10;
    logger.debug(`Calculated monthly target hours: ${roundedHours} (from ${fortnightHours} fortnight hours and ${workDaysInMonth} work days)`);
    
    return roundedHours;
  } catch (error) {
    logger.error("Error calculating monthly target hours:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to calculate monthly target hours: ${error}`);
    }
  }
};

/**
 * Calculate adjusted fortnight hours based on work schedule and FTE
 * @param workSchedule The work schedule
 * @param userFte User's full-time equivalent value (0-1)
 * @returns Adjusted fortnight hours
 * @throws Error if inputs are invalid
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
    if (isNaN(userFte) || userFte < 0 || userFte > 2) {
      throw new Error(`Invalid FTE value: ${userFte}. Must be between 0 and 2.`);
    }
    
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
    logger.error("Error calculating adjusted fortnight hours:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to calculate adjusted fortnight hours: ${error}`);
    }
  }
};
