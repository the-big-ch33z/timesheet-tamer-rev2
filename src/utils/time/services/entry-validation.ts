
import { TimeEntry } from "@/types";
import { ValidationResult } from "./types";
import { ensureDate, isValidDate } from '../validation/dateValidation';
import { calculateHoursFromTimes } from '../calculations/hoursCalculations';
import { TimeCalculationError } from '../errors/timeErrorHandling';

/**
 * Validates time entry data
 */
export function validateEntry(entry: Partial<TimeEntry>): ValidationResult {
  // Check for required fields
  if (!entry.userId) {
    return { valid: false, message: "User ID is required" };
  }
  
  if (!entry.date) {
    return { valid: false, message: "Date is required" };
  }
  
  // Validate date
  const validDate = ensureDate(entry.date);
  if (!validDate) {
    return { valid: false, message: "Invalid date format" };
  }
  
  // Validate hours if provided
  if (entry.hours !== undefined) {
    if (isNaN(entry.hours) || entry.hours < 0) {
      return { valid: false, message: "Hours must be a positive number" };
    }
    
    // Check for unrealistically high values
    if (entry.hours > 24) {
      return { valid: false, message: "Hours cannot exceed 24 for a single entry" };
    }
  }
  
  // Validate time fields if both are provided
  if (entry.startTime && entry.endTime) {
    try {
      // This will throw if times are invalid
      calculateHoursFromTimes(entry.startTime, entry.endTime);
    } catch (error) {
      if (error instanceof TimeCalculationError) {
        return { valid: false, message: error.message };
      }
      return { valid: false, message: "Invalid time format" };
    }
  }
  
  return { valid: true };
}

/**
 * Auto-calculate hours from start and end times
 */
export function autoCalculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0;
  }
  
  try {
    return calculateHoursFromTimes(startTime, endTime);
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
}

/**
 * Calculate total hours from a list of entries
 */
export function calculateTotalHours(entries: TimeEntry[]): number {
  const totalHours = entries.reduce((total, entry) => {
    return total + (entry.hours || 0);
  }, 0);
  
  return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
}
