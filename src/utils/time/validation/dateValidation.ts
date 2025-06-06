
/**
 * Date validation utilities
 * Functions for validating date values
 */
import { isValid, parseISO, isSameDay, isAfter, isBefore, format } from 'date-fns';
import { formatDate } from '../formatting/timeFormatting';

/**
 * Validates if a value is a valid Date object
 * @param date Value to validate
 * @returns Boolean indicating if value is a valid Date
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  // If it's already a Date object, check if it's valid
  if (date instanceof Date) {
    return isValid(date);
  }
  
  // If it's a string, try to parse it
  if (typeof date === 'string') {
    try {
      const parsedDate = parseISO(date);
      return isValid(parsedDate);
    } catch (error) {
      console.error("Error validating date string:", error);
      return false;
    }
  }
  
  return false;
};

/**
 * Ensures a value is a valid Date object
 * @param date Value to convert to Date
 * @returns Valid Date object or null if conversion fails
 */
export const ensureDate = (date: any): Date | null => {
  if (!date) return null;
  
  // If already a valid Date object, return it
  if (date instanceof Date && isValid(date)) {
    return date;
  }
  
  // If it's a string, try to parse it
  if (typeof date === 'string') {
    try {
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (error) {
      console.error("Error converting string to Date:", error);
    }
  }
  
  return null;
};

/**
 * Safely compares two dates for equality (same day)
 * @param dateA First date
 * @param dateB Second date
 * @returns Boolean indicating if dates represent the same day
 */
export const areSameDates = (dateA: Date | string | null | undefined, dateB: Date | string | null | undefined): boolean => {
  if (!dateA || !dateB) return false;
  
  const validDateA = ensureDate(dateA);
  const validDateB = ensureDate(dateB);
  
  if (!validDateA || !validDateB) return false;
  
  return isSameDay(validDateA, validDateB);
};

/**
 * Compare dates for sorting (handles null/invalid values)
 * @param dateA First date
 * @param dateB Second date
 * @returns Negative if dateA < dateB, positive if dateA > dateB, 0 if equal
 */
export const compareDates = (dateA: Date | string | null | undefined, dateB: Date | string | null | undefined): number => {
  const validDateA = ensureDate(dateA);
  const validDateB = ensureDate(dateB);
  
  // Handle null cases
  if (!validDateA && !validDateB) return 0;
  if (!validDateA) return -1; 
  if (!validDateB) return 1;
  
  // Both dates are valid
  if (isBefore(validDateA, validDateB)) return -1;
  if (isAfter(validDateA, validDateB)) return 1;
  return 0;
};

/**
 * Format error message for invalid date
 * @param fieldName Name of field with invalid date
 * @param value Invalid value
 * @returns Error message
 */
export const invalidDateMessage = (fieldName: string, value: any): string => {
  return `Invalid date for ${fieldName}: ${String(value)}`;
};

/**
 * Get today's date with time set to midnight
 * @returns Today's date at midnight
 */
export const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Format date for consistent comparison (YYYY-MM-DD format)
 * @param date Date to format
 * @returns Formatted date string or empty string if invalid
 */
export const formatDateForComparison = (date: Date | string | null | undefined): string => {
  const validDate = ensureDate(date);
  if (!validDate) return '';
  
  return format(validDate, 'yyyy-MM-dd');
};

/**
 * Validate that start time comes before end time
 * @param startTime Start time string (HH:mm format)
 * @param endTime End time string (HH:mm format)
 * @returns Validation result with valid flag and optional error message
 */
export const validateTimeOrder = (startTime: string, endTime: string): { valid: boolean; message?: string } => {
  if (!startTime || !endTime) {
    return { valid: false, message: 'Both start and end times are required' };
  }
  
  try {
    // Convert to comparable values (assume same date)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startValue = startHour * 60 + startMinute;
    const endValue = endHour * 60 + endMinute;
    
    if (startValue >= endValue) {
      return { 
        valid: false, 
        message: 'End time must be after start time' 
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("Error validating time order:", error);
    return { 
      valid: false, 
      message: 'Invalid time format' 
    };
  }
};

