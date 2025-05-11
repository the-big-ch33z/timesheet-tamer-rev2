
import { TimeEntry } from "@/types";
import { ValidationResult } from "./types";

/**
 * Validate a time entry for completeness and correctness
 */
export const validateTimeEntry = (entry: Partial<TimeEntry>): ValidationResult => {
  const errors: string[] = [];
  
  // Check required fields
  if (!entry.userId) errors.push("User ID is required");
  if (!entry.date) errors.push("Date is required");
  if (typeof entry.hours !== 'number' || entry.hours <= 0) errors.push("Hours must be a positive number");
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate total hours from a list of entries
 */
export const calculateTotalHours = (entries: TimeEntry[]): number => {
  if (!entries || entries.length === 0) {
    return 0;
  }
  
  return entries.reduce((total, entry) => {
    return total + (typeof entry.hours === 'number' ? entry.hours : 0);
  }, 0);
};

/**
 * Auto-calculate hours from start and end time
 */
export const autoCalculateHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) {
    return 0;
  }
  
  try {
    // Parse times (assuming format like "HH:MM")
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Handle overnight shifts
    const totalMinutes = endMinutes >= startMinutes 
      ? endMinutes - startMinutes 
      : (24 * 60) - startMinutes + endMinutes;
    
    // Convert to hours with 2 decimal precision
    return Math.round((totalMinutes / 60) * 100) / 100;
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
};
