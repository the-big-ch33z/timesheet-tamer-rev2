
/**
 * Time utilities index
 * Central export point for all time-related utility functions
 * 
 * This module serves as the single source of truth for all time-related operations,
 * ensuring consistency across the application.
 */

// Export all calculation utilities
export * from './calculations';

// Export error handling utilities
export * from './errors';

// Export formatting utilities
export * from './formatting';

// Export schedule utilities
export * from './scheduleUtils';

// Export validation utilities
export * from './validation';

// Export services - now explicitly exporting the unified service
export * from './services';

// Explicitly re-export key functions to resolve any ambiguity
export { formatDateForComparison } from './validation/dateValidation';
export { 
  calculateHoursFromTimes,
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours
} from './calculations/hoursCalculations';
export { 
  calculateHoursVariance, 
  isUndertime 
} from './calculations/timeCalculations';
export { formatTimeForDisplay, formatHours, formatDate } from './formatting/timeFormatting';
// Updated to use the unified service from the new structure
export { unifiedTimeEntryService } from './services';
export { createTimeLogger } from './errors/timeLogger';
