
import { TimeCalculationError } from '../errors/timeErrorHandling';

/**
 * Calculate hours variance between scheduled and actual hours
 */
export const calculateHoursVariance = (
  scheduledHours: number,
  actualHours: number
): number => {
  if (isNaN(scheduledHours) || isNaN(actualHours)) {
    throw new TimeCalculationError('Invalid hours provided for variance calculation');
  }
  
  return Math.round((scheduledHours - actualHours) * 10) / 10;
};

/**
 * Check if current hours indicate undertime
 */
export const isUndertime = (
  scheduledHours: number,
  actualHours: number,
  threshold: number = 0.1
): boolean => {
  const variance = calculateHoursVariance(scheduledHours, actualHours);
  return variance > threshold;
};

/**
 * Safely calculate hours variance with fallback
 */
export const safeCalculateVariance = (
  scheduledHours: number | undefined,
  actualHours: number | undefined,
  fallback: number = 0
): number => {
  try {
    if (typeof scheduledHours !== 'number' || typeof actualHours !== 'number') {
      return fallback;
    }
    return calculateHoursVariance(scheduledHours, actualHours);
  } catch (error) {
    console.error('Error calculating variance:', error);
    return fallback;
  }
};
