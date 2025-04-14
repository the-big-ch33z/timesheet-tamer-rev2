
/**
 * Error handling utilities for time-related operations
 */

// Export all error handling utilities
export * from './timeErrorHandling';
export * from './timeLogger';

// Explicitly re-export key items to avoid ambiguity
export {
  TimeError,
  TimeCalculationError,
  TimeValidationError,
  validateTimeString,
  validateNumberInRange,
  safeTimeOperation,
  safeCalculation,
  formatTimeError
} from './timeErrorHandling';

export {
  createTimeLogger,
  type LogLevel
} from './timeLogger';
