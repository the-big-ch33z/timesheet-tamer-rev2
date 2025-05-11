
/**
 * Re-export all calculation utilities for easier imports
 */

// Explicitly export from timeCalculations to avoid conflicts
export { 
  calculateHoursVariance,
  isUndertime,
  safeCalculateVariance
} from './timeCalculations';

// Explicitly export from hoursCalculations - these take precedence over timeCalculations versions
export { 
  calculateHoursFromTimes,
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours,
  calculateFortnightHoursFromSchedule,
  countRdoDaysInMonth
} from './hoursCalculations';

// Export variance calculations for backward compatibility
export * from './varianceCalculations';

// Export schedule utilities but exclude the functions that might cause ambiguity
export { 
  getDayScheduleInfo,
  isWorkingDay,
  isHolidayDate,
  isNonWorkingDay,
  calculateDayHoursWithBreaks,
  calculateDayHours,
  clearHolidayCache,
  isRDODay,
  getWeekDay,
  getFortnightWeek,
  getWorkdaysInMonth
} from '../scheduleUtils';
