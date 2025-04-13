
/**
 * Time validation utilities
 * Functions for validating time entries against schedules and business rules
 */
import { WorkSchedule, WeekDay } from "@/types";
import { getWeekDay, getFortnightWeek } from "../scheduleUtils";
import { TimeValidationError, createTimeLogger } from "../errors/timeErrorHandling";

// Create a logger instance
const logger = createTimeLogger('TimeValidation');

// Define a validation result type for clean type checking
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Check if the selected time is within the working hours
export const validateTime = (
  start: string, 
  end: string, 
  selectedDate: Date, 
  workSchedule?: WorkSchedule
): ValidationResult => {
  try {
    // First check if both times are provided and valid
    if (!start || !end) {
      return { 
        valid: false,
        message: !start ? "Start time is required" : "End time is required"
      };
    }

    if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) {
      return { 
        valid: false,
        message: "Time must be in valid HH:MM format"
      };
    }

    // If no schedule provided, just validate basic time logic
    if (!workSchedule || !selectedDate) {
      return validateTimeOrder(start, end);
    }

    const weekDay = getWeekDay(selectedDate);
    const weekNum = getFortnightWeek(selectedDate);
    
    logger.debug(`Validating time for ${selectedDate.toISOString().split('T')[0]}, day: ${weekDay}, week: ${weekNum}`);
    
    // Check if it's an RDO
    if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
      logger.info(`Date ${selectedDate.toISOString().split('T')[0]} is an RDO`);
      return {
        valid: false,
        message: "This is a rostered day off (RDO). Time entries are not expected."
      };
    }
    
    // Get scheduled work hours for this day
    const scheduledHours = workSchedule.weeks[weekNum][weekDay];
    
    // If no scheduled hours, it's not a working day
    if (!scheduledHours) {
      logger.info(`Date ${selectedDate.toISOString().split('T')[0]} is not a scheduled working day`);
      return {
        valid: false,
        message: "This is not a scheduled working day."
      };
    }
    
    // Check if time is within working hours
    const schedStart = scheduledHours.startTime;
    const schedEnd = scheduledHours.endTime;
    
    if (start < schedStart || end > schedEnd) {
      logger.warn(`Time ${start}-${end} is outside scheduled hours ${schedStart}-${schedEnd}`);
      return {
        valid: false,
        message: `Time entries should be within scheduled working hours (${schedStart} - ${schedEnd}).`
      };
    }
    
    logger.debug(`Time validation successful for ${start}-${end}`);
    return { valid: true };
  } catch (error) {
    logger.error("Error validating time", error);
    return { 
      valid: false, 
      message: error instanceof Error ? 
        `Validation error: ${error.message}` : 
        "An unknown error occurred during time validation"
    };
  }
};

/**
 * Validate if a time string is in proper HH:MM format
 * @param timeString Time string to validate
 * @returns True if the time string is valid
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  try {
    if (!timeString) {
      return false;
    }
    
    // Check if the string matches the HH:MM pattern
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timePattern.test(timeString);
  } catch (error) {
    logger.error(`Error validating time format for "${timeString}"`, error);
    return false;
  }
};

/**
 * Validate a time string against a strict format and throw an error if invalid
 * @param timeString Time string to validate
 * @param fieldName Field name for error message
 * @throws TimeValidationError if validation fails
 */
export const validateTimeFormat = (timeString: string, fieldName: string = 'Time'): void => {
  if (!timeString) {
    throw new TimeValidationError(`${fieldName} cannot be empty`);
  }
  
  if (!isValidTimeFormat(timeString)) {
    throw new TimeValidationError(
      `Invalid ${fieldName.toLowerCase()} format: ${timeString}. Must be in HH:MM format (24-hour).`
    );
  }
};

/**
 * Validate that end time is after start time
 * @param startTime Start time string (HH:MM)
 * @param endTime End time string (HH:MM)
 * @param allowOvernight Allow overnight shifts (end time on next day)
 * @returns Validation result
 */
export const validateTimeOrder = (startTime: string, endTime: string, allowOvernight: boolean = true): ValidationResult => {
  try {
    // Check if inputs are valid before comparing
    if (!startTime || !endTime) {
      return {
        valid: false,
        message: !startTime ? "Start time is required" : "End time is required"
      };
    }
    
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return {
        valid: false,
        message: "Invalid time format. Please use HH:MM format."
      };
    }
    
    // If times are equal, that's invalid
    if (startTime === endTime) {
      return {
        valid: false,
        message: "Start time and end time cannot be the same."
      };
    }
    
    // For overnight shifts, any combination is valid
    if (allowOvernight) {
      return { valid: true };
    }
    
    // Check if end time is after start time
    if (endTime < startTime) {
      return {
        valid: false,
        message: "End time must be after start time."
      };
    }
    
    return { valid: true };
  } catch (error) {
    logger.error("Error validating time order", error);
    return { 
      valid: false, 
      message: "An error occurred while validating times."
    };
  }
};
