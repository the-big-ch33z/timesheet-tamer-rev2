
/**
 * Time calculation error handling utilities
 * Provides standardized error handling for time-related operations
 */

/**
 * Custom error class for time calculation errors
 */
export class TimeCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeCalculationError';
  }
}

/**
 * Custom error class for time validation errors
 */
export class TimeValidationError extends TimeCalculationError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeValidationError';
  }
}

/**
 * Custom error class for time format errors
 */
export class TimeFormatError extends TimeCalculationError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeFormatError';
  }
}

/**
 * Validates a time string is in HH:MM format
 * @param timeStr The time string to validate
 * @param fieldName Name of the field for error message
 * @returns The validated time string
 * @throws TimeValidationError if validation fails
 */
export const validateTimeString = (timeStr: string, fieldName: string = 'Time'): string => {
  if (!timeStr) {
    throw new TimeValidationError(`${fieldName} is required`);
  }
  
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    throw new TimeValidationError(
      `${fieldName} "${timeStr}" is not valid. Must be in HH:MM format (24-hour).`
    );
  }
  
  return timeStr;
};

/**
 * Validates a number is within expected range
 * @param value The number to validate
 * @param fieldName Name of the field for error message
 * @param min Minimum allowed value (inclusive)
 * @param max Maximum allowed value (inclusive)
 * @returns The validated number
 * @throws TimeValidationError if validation fails
 */
export const validateNumberInRange = (
  value: number,
  fieldName: string,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number => {
  if (isNaN(value)) {
    throw new TimeValidationError(`${fieldName} must be a valid number`);
  }
  
  if (value < min || value > max) {
    throw new TimeValidationError(
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
  
  return value;
};

/**
 * Safely executes a calculation function with error handling
 * @param calculationFn The calculation function to execute
 * @param args Arguments to pass to the calculation function
 * @param errorContext Context description for error message
 * @returns Result of the calculation
 * @throws TimeCalculationError with context if calculation fails
 */
export const safeCalculation = <T extends (...args: any[]) => any>(
  calculationFn: T,
  args: Parameters<T>,
  errorContext: string
): ReturnType<T> => {
  try {
    return calculationFn(...args);
  } catch (error) {
    if (error instanceof TimeCalculationError) {
      throw error; // Re-throw existing TimeCalculationErrors
    }
    
    // Convert other errors to TimeCalculationError with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new TimeCalculationError(`${errorContext}: ${errorMessage}`);
  }
};

/**
 * Create consistent logger structure for time utilities
 * @param context The context (usually component or function name)
 * @returns Logger object with standard methods
 */
export const createTimeLogger = (context: string) => {
  return {
    error: (message: string, error?: any) => 
      console.error(`[Time:${context}] ${message}`, error),
    warn: (message: string, data?: any) => 
      console.warn(`[Time:${context}] ${message}`, data),
    info: (message: string, data?: any) => 
      console.info(`[Time:${context}] ${message}`, data),
    debug: (message: string, data?: any) => 
      console.debug(`[Time:${context}] ${message}`, data)
  };
};

/**
 * Formats an error message with context
 * @param baseMessage Base error message
 * @param context Context information
 * @param details Additional error details
 * @returns Formatted error message
 */
export const formatErrorMessage = (
  baseMessage: string,
  context?: string,
  details?: string
): string => {
  let message = baseMessage;
  
  if (context) {
    message = `${context}: ${message}`;
  }
  
  if (details) {
    message = `${message} (${details})`;
  }
  
  return message;
};
