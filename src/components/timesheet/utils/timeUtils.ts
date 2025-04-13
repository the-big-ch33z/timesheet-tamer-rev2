
/**
 * Time utilities for timesheet components
 * Consolidates duplicate time calculation functions
 */
import { format } from 'date-fns';

/**
 * Calculates hours between start and end time
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @returns Number of hours between times
 */
export const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
  try {
    console.log(`Calculating hours from times: ${startTime} to ${endTime}`);
    
    // Parse the time strings into hours and minutes
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Calculate the difference in minutes
    let diffMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle cases where end time is on the next day
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    
    // Convert minutes to hours with 1 decimal place
    const hours = Math.round(diffMinutes / 6) / 10;
    console.log(`Calculated hours: ${hours}`);
    return hours;
  } catch (error) {
    console.error("Error calculating hours from times:", error);
    return 0;
  }
};

/**
 * Format hours to display format
 * @param hours Number of hours
 * @returns Formatted string (e.g. "8.0 hrs")
 */
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)} hrs`;
};

/**
 * Calculate hours variance between total and target
 * @param totalHours Actual hours worked
 * @param targetHours Target hours
 * @returns Variance (negative means undertime)
 */
export const calculateHoursVariance = (totalHours: number, targetHours: number): number => {
  return totalHours - targetHours;
};

/**
 * Check if hours variance indicates undertime
 * @param variance Hours variance
 * @returns true if undertime (negative variance)
 */
export const isUndertime = (variance: number): boolean => {
  return variance < 0;
};

/**
 * Convert time string to formatted display
 * @param timeString Time in HH:MM format
 * @returns Formatted time (e.g. "9:00 AM")
 */
export const formatTimeForDisplay = (timeString: string): string => {
  try {
    return format(new Date(`2000-01-01T${timeString}`), "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
};
