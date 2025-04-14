
/**
 * Calculate the variance between actual and expected hours
 */
export const calculateHoursVariance = (actualHours: number, expectedHours: number): number => {
  if (!expectedHours) return 0;
  return actualHours - expectedHours;
};

/**
 * Check if hours are under the expected amount
 */
export const isUndertime = (hoursVariance: number): boolean => {
  return hoursVariance < 0;
};
