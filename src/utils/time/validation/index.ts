
/**
 * Time validation utilities index
 * Central export point for all time validation functions
 * 
 * This module provides consistent validation logic for all time-related operations.
 */

export * from './timeValidation';
export * from './dateValidation';

// To avoid naming conflicts, we can be explicit about certain exports
export {
  validateTimeOrder,
  isValidTimeFormat,
  validateTimeFormat
} from './timeValidation';

export {
  isValidDate,
  ensureDate,
  areSameDates,
  compareDates,
  formatDateForComparison,
  getTodayAtMidnight
} from './dateValidation';
