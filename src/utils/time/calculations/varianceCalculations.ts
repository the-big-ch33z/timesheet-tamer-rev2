
/**
 * Variance calculation utilities
 * Functions for calculating differences between actual and expected hours
 */

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
