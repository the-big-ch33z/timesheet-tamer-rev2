
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

// Re-export functions from hoursCalculations.ts that are used across the application
export { 
  calculateHoursFromTimes,
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours,
  calculateFortnightHoursFromSchedule
} from './hoursCalculations';

// Export additional utility functions if needed from other files
export { 
  safeCalculateVariance 
} from './varianceCalculations';

