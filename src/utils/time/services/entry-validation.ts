
import { TimeEntry } from "@/types";
import { ValidationResult, calculateTotalHours, autoCalculateHours } from "./types";

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

// Re-export core calculation functions from types
export { calculateTotalHours, autoCalculateHours };
