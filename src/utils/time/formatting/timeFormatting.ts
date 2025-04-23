import { format } from 'date-fns';

/**
 * Format hours for display (e.g. "8.5" -> "8.5h"), preserving up to two decimals without unnecessary rounding.
 */
export const formatHours = (hours: number): string => {
  if (isNaN(hours)) return '0h';
  // Always display up to 2 decimals, but strip trailing zeros (e.g. 0.25, 1.5, 2)
  // Use toFixed(2) then remove trailing .00 or .0
  let s = hours.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  return `${s}h`;
};

/**
 * Format display hours with plus/minus (e.g. "+8.5h" or "-2.0h")
 */
export const formatDisplayHours = (hours: number): string => {
  if (isNaN(hours)) return '0h';
  const sign = hours >= 0 ? '+' : '';
  return `${sign}${formatHours(hours).replace('h','')}h`;
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

/**
 * Format date for comparison
 */
export const formatDateForComparison = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for comparison:', error);
    return '';
  }
};
