
import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('entry-validation');

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validate a time entry
 */
export function validateTimeEntry(entry: Partial<TimeEntry>): ValidationResult {
  if (!entry.hours || entry.hours <= 0) {
    return {
      valid: false,
      message: "Hours must be greater than 0"
    };
  }

  if (!entry.date) {
    return {
      valid: false,
      message: "Date is required"
    };
  }

  return { valid: true };
}

/**
 * Auto-calculate hours from start and end times
 */
export function autoCalculateHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  const minutes = endMinute - startMinute;
  
  hours += minutes / 60;
  
  return Math.max(0, parseFloat(hours.toFixed(2)));
}

/**
 * Calculate total hours from a list of entries
 */
export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
}
