
/**
 * Time formatting utilities
 * Functions for formatting time values for display
 */
import { format, isValid, parseISO } from 'date-fns';

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
    if (!timeString || timeString.trim() === '') {
      return '';
    }
    return format(new Date(`2000-01-01T${timeString}`), "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
};

/**
 * Standard date formatting for consistency
 * @param date Date to format
 * @param formatStr Optional format string (defaults to yyyy-MM-dd)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string => {
  try {
    if (!date) return '';
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Validate date
    if (!isValid(dateObj)) {
      console.warn('Invalid date passed to formatDate:', date);
      return '';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error, "for value:", date);
    return typeof date === 'string' ? date : '';
  }
};

/**
 * Format date for display in UI (user-friendly format)
 * @param date Date to format
 * @returns Formatted date string in user-friendly format
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  return formatDate(date, 'MMM d, yyyy'); // e.g., "Jan 1, 2024"
};

/**
 * Format date and time together
 * @param date Date object
 * @param time Time string in HH:MM format
 * @returns Formatted date and time string
 */
export const formatDateWithTime = (date: Date, time: string): string => {
  try {
    if (!date || !time) return '';
    
    const dateStr = formatDate(date);
    return `${dateStr} ${time}`;
  } catch (error) {
    console.error("Error formatting date with time:", error);
    return '';
  }
};

/**
 * Format date for comparison (strips time component)
 * @param date Date to format
 * @returns Date string in yyyy-MM-dd format
 */
export const formatDateForComparison = (date: Date | string | null | undefined): string => {
  return formatDate(date, 'yyyy-MM-dd');
};
