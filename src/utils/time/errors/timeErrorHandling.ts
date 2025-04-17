
/**
 * Error handling utilities for time-related operations
 */
import { createTimeLogger } from './timeLogger';

// Standard error class for time-related errors
export class TimeError extends Error {
  context: string;
  timestamp: Date;
  
  constructor(message: string, context = 'Time Operation') {
    super(message);
    this.name = 'TimeError';
    this.context = context;
    this.timestamp = new Date();
  }
}

// Specialized error for time calculations
export class TimeCalculationError extends TimeError {
  constructor(message: string, context = 'Time Calculation') {
    super(message, context);
    this.name = 'TimeCalculationError';
  }
}

// Specialized error for time validation
export class TimeValidationError extends TimeError {
  constructor(message: string, context = 'Time Validation') {
    super(message, context);
    this.name = 'TimeValidationError';
  }
}

// Create a specific logger for error handling
const errorLogger = createTimeLogger('TimeErrorHandler', { minLevel: 'error' });

/**
 * Validates a time string has the correct format (HH:MM)
 * @param timeString Time string to validate
 * @param fieldName Name of the field for error reporting
 * @throws TimeValidationError if the format is invalid
 */
export function validateTimeString(timeString: string, fieldName = 'Time'): void {
  if (!timeString) {
    throw new TimeValidationError(`${fieldName} is required`);
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeString)) {
    throw new TimeValidationError(
      `${fieldName} must be in 24-hour format (HH:MM) with leading zeros`
    );
  }
}

/**
 * Validates a number is within the specified range
 * @param value Number to validate
 * @param fieldName Name of the field for error reporting
 * @param min Minimum allowed value (inclusive)
 * @param max Maximum allowed value (inclusive)
 * @throws TimeValidationError if the value is outside the range
 */
export function validateNumberInRange(
  value: number, 
  fieldName: string, 
  min: number, 
  max: number
): void {
  if (isNaN(value)) {
    throw new TimeValidationError(`${fieldName} must be a number`);
  }

  if (value < min || value > max) {
    throw new TimeValidationError(
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
}

/**
 * Safely executes a time-related operation with error handling
 * @param operation Function to execute
 * @param fallbackValue Value to return if operation fails
 * @param context Context for error reporting
 */
export function safeTimeOperation<T>(
  operation: () => T,
  fallbackValue: T,
  context = 'Time Operation'
): T {
  try {
    return operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errorLogger.error(`Error in ${context}: ${errorMessage}`);
    return fallbackValue;
  }
}

// Renamed version of safeTimeOperation for consistency with imports
export const safeCalculation = safeTimeOperation;

/**
 * Format a time-related error for display
 * @param error Error object
 * @param userFriendly Whether to return a user-friendly message
 */
export function formatTimeError(
  error: unknown,
  userFriendly = true
): string {
  if (error instanceof TimeError) {
    return userFriendly
      ? `Something went wrong with time calculations. Please try again.`
      : `[${error.context}] ${error.message}`;
  }
  
  if (error instanceof Error) {
    return userFriendly
      ? `Something went wrong. Please try again.`
      : error.message;
  }
  
  return userFriendly
    ? `An unknown error occurred. Please try again.`
    : String(error);
}

// Re-export createTimeLogger to maintain compatibility with existing imports
export { createTimeLogger } from './timeLogger';

