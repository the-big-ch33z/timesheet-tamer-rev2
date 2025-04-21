
/**
 * Re-export all calculation utilities for easier imports
 */
export * from './hoursCalculations';
export * from './varianceCalculations';
export * from './timeCalculations';

// To avoid ambiguous exports, explicitly re-export key functions
export {
  calculateHoursFromTimes,
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours,
  calculateFortnightHoursFromSchedule
} from './hoursCalculations';

export {
  calculateHoursVariance,
  isUndertime,
  safeCalculateVariance
} from './varianceCalculations';

