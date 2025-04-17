
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

// Export services - use unified service only
export * from './services';

// Explicitly re-export key functions to resolve any ambiguity
export { formatDateForComparison } from './validation/dateValidation';
export { 
  calculateHoursFromTimes,
  calculateMonthlyTargetHours 
} from './calculations/hoursCalculations';
export { 
  calculateHoursVariance, 
  isUndertime 
} from './calculations/varianceCalculations';
export { formatTimeForDisplay, formatHours, formatDate } from './formatting/timeFormatting';
// Updated to use the unified service instead of the old service
export { unifiedTimeEntryService } from './services/unifiedTimeEntryService';
export { createTimeLogger } from './errors/timeLogger';
