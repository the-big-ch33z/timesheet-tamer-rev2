
/**
 * Re-export all calculation utilities for easier imports
 */
export * from './timeCalculations';
// Export scheduleUtils but exclude the functions that might cause ambiguity
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

// These specific functions are now only exported from scheduleUtils to avoid ambiguity
export { 
  calculateFortnightHoursFromSchedule,
  calculateAdjustedFortnightHours 
} from '../scheduleUtils';

// For backward compatibility, also re-export from specialized files
export * from './varianceCalculations';
