import { TimeEntry } from "@/types";
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('entry-validation');

/**
 * Enhanced validation result type with error details
 */
export interface ValidationResult {
  isValid: boolean;
  valid: boolean; // Keep both for compatibility
  errors?: string[];
  message?: string;
}

/**
 * Validate a time entry with detailed error reporting
 */
export function validateTimeEntry(entry: Partial<TimeEntry>): ValidationResult {
  console.log(`[TOIL-DEBUG] ==> VALIDATING ENTRY:`, entry);
  logger.debug('Validating time entry:', entry);
  
  const errors: string[] = [];

  if (!entry.hours || entry.hours <= 0) {
    errors.push("Hours must be greater than 0");
  }

  if (!entry.date) {
    errors.push("Date is required");
  }

  if (!entry.userId) {
    errors.push("User ID is required");
  }

  const isValid = errors.length === 0;
  
  console.log(`[TOIL-DEBUG] ✅ VALIDATION RESULT:`, {
    isValid,
    errorsCount: errors.length,
    errors
  });
  
  logger.debug('Validation result:', { isValid, errors });

  return {
    isValid,
    valid: isValid, // Provide both properties for compatibility
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? errors.join(', ') : undefined
  };
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
