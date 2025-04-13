
/**
 * Time formatting utilities
 * Functions for formatting time values for display
 */
import { format } from 'date-fns';

/**
 * Format hours to display format
 * @param hours Number of hours
 * @returns Formatted string (e.g. "8.0 hrs")
 */
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)} hrs`;
};

/**
 * Format hours for display with one decimal place
 * @param hours Number of hours
 * @returns Formatted number string with one decimal place
 */
export const formatDisplayHours = (hours: number): string => {
  return hours.toFixed(1);
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
