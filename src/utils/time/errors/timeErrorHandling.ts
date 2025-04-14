
/**
 * Error handling utilities for time-related operations
 */
import { createTimeLogger } from './timeLogger';

// Standard error class for time-related errors
export class TimeError extends Error {
  context: string;
  timestamp: Date;
  
  constructor(message: string, context: string = 'Time Operation') {
    super(message);
    this.name = 'TimeError';
    this.context = context;
    this.timestamp = new Date();
  }
}

// Create a specific logger for error handling
const errorLogger = createTimeLogger('TimeErrorHandler', { minLevel: 'error' });

/**
 * Safely executes a time-related operation with error handling
 * @param operation Function to execute
 * @param fallbackValue Value to return if operation fails
 * @param context Context for error reporting
 */
export function safeTimeOperation<T>(
  operation: () => T,
  fallbackValue: T,
  context: string = 'Time Operation'
): T {
  try {
    return operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errorLogger.error(`Error in ${context}: ${errorMessage}`);
    return fallbackValue;
  }
}

/**
 * Format a time-related error for display
 * @param error Error object
 * @param userFriendly Whether to return a user-friendly message
 */
export function formatTimeError(
  error: unknown,
  userFriendly: boolean = true
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
