
/**
 * Time error handling utilities index
 * Provides standardized error handling mechanisms for time-related operations
 */

export * from './timeErrorHandling';

// Export key error classes explicitly
export {
  TimeCalculationError,
  TimeValidationError,
  TimeFormatError,
  validateTimeString,
  validateNumberInRange,
  safeCalculation,
  createTimeLogger
} from './timeErrorHandling';
