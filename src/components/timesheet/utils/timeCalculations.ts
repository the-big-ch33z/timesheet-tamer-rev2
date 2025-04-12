
import { calculateHoursFromTimes, formatHours } from "@/components/timesheet/entry-dialog/utils/timeCalculations";

/**
 * Calculate variance between actual and expected hours
 * @param totalHours The actual hours worked
 * @param expectedHours The expected hours to work
 * @returns Variance value (can be negative for undertime)
 */
export const calculateHoursVariance = (totalHours: number, expectedHours: number): number => {
  return totalHours - expectedHours;
};

/**
 * Determines if the hours are under the expected value
 * @param variance The variance between actual and expected hours
 * @returns Boolean indicating if hours are under expected
 */
export const isUndertime = (variance: number): boolean => {
  return variance < 0;
};

/**
 * Format hours for display with fixed decimal places
 * @param hours Number of hours
 * @returns Formatted hours string
 */
export const formatDisplayHours = (hours: number): string => {
  return hours.toFixed(1);
};

// Re-export time calculation functions for convenience
export { 
  calculateHoursFromTimes, 
  formatHours 
} from "@/components/timesheet/entry-dialog/utils/timeCalculations";
