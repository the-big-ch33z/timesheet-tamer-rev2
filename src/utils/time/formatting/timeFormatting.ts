
import { format } from 'date-fns';

/**
 * Format hours for display (e.g. "8.5" -> "8.5h")
 */
export const formatHours = (hours: number): string => {
  if (isNaN(hours)) return '0h';
  return `${Math.round(hours * 10) / 10}h`;
};

/**
 * Format display hours with plus/minus (e.g. "+8.5h" or "-2.0h")
 */
export const formatDisplayHours = (hours: number): string => {
  if (isNaN(hours)) return '0h';
  const sign = hours >= 0 ? '+' : '';
  return `${sign}${formatHours(hours)}`;
};

/**
 * Format time for display (e.g. "09:00" -> "9:00 AM")
 */
export const formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  
  try {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

/**
 * Format date using date-fns
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Format date with time
 */
export const formatDateWithTime = (date: Date | string, time?: string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const baseFormat = format(dateObj, 'MMMM d, yyyy');
    return time ? `${baseFormat} at ${formatTimeForDisplay(time)}` : baseFormat;
  } catch (error) {
    console.error('Error formatting date with time:', error);
    return '';
  }
};
