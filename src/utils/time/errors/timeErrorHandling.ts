
/**
 * Base class for time-related errors
 */
export class TimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeError';
  }
}

/**
 * Error for time calculation issues
 */
export class TimeCalculationError extends TimeError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeCalculationError';
  }
}

/**
 * Error for time validation issues
 */
export class TimeValidationError extends TimeError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeValidationError';
  }
}

/**
 * Validate a time string meets format requirements
 */
export const validateTimeString = (time: string): void => {
  if (!time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    throw new TimeValidationError('Invalid time format. Use HH:MM (24-hour)');
  }
};

/**
 * Validate a number is within a specified range
 */
export const validateNumberInRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): void => {
  if (value < min || value > max) {
    throw new TimeValidationError(
      `${fieldName} must be between ${min} and ${max}`
    );
  }
};

/**
 * Wrap a time operation in error handling
 */
export const safeTimeOperation = <T>(
  operation: () => T,
  fallback: T
): T => {
  try {
    return operation();
  } catch (error) {
    console.error('Time operation failed:', error);
    return fallback;
  }
};

/**
 * Wrap a calculation in error handling
 */
export const safeCalculation = (
  calculation: () => number,
  fallback: number = 0
): number => {
  return safeTimeOperation(calculation, fallback);
};

/**
 * Format error message for display
 */
export const formatTimeError = (error: unknown): string => {
  if (error instanceof TimeError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};
