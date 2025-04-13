
/**
 * Variance calculation utilities
 * Functions for calculating differences between actual and expected hours
 */
import { 
  TimeCalculationError, 
  validateNumberInRange, 
  createTimeLogger,
  safeCalculation
} from '../errors/timeErrorHandling';

// Create a logger instance for variance calculations
const logger = createTimeLogger('VarianceCalculations');

/**
 * Calculate hours variance between total and target
 * @param totalHours Actual hours worked
 * @param targetHours Target hours
 * @returns Variance (negative means undertime)
 * @throws TimeCalculationError if inputs are invalid
 */
export const calculateHoursVariance = (totalHours: number, targetHours: number): number => {
  try {
    // Input validation
    validateNumberInRange(totalHours, 'Total hours', 0, 1000);
    validateNumberInRange(targetHours, 'Target hours', 0, 1000);
    
    const variance = totalHours - targetHours;
    logger.debug(`Calculated hours variance: ${variance} (${totalHours} - ${targetHours})`);
    
    return variance;
  } catch (error) {
    // Handle and rethrow with better context
    if (error instanceof TimeCalculationError) {
      logger.error(`Failed to calculate hours variance: ${error.message}`, error);
      throw error;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error calculating hours variance: ${message}`, error);
      throw new TimeCalculationError(
        `Failed to calculate hours variance between ${totalHours} and ${targetHours}: ${message}`
      );
    }
  }
};

/**
 * Check if hours variance indicates undertime
 * @param variance Hours variance
 * @returns true if undertime (negative variance)
 * @throws TimeCalculationError if input is invalid
 */
export const isUndertime = (variance: number): boolean => {
  try {
    // Input validation
    if (isNaN(variance)) {
      throw new TimeCalculationError(`Invalid variance value: ${variance}. Must be a number.`);
    }
    
    const result = variance < 0;
    logger.debug(`Checking if ${variance} is undertime: ${result}`);
    
    return result;
  } catch (error) {
    // Handle and rethrow with better context
    if (error instanceof TimeCalculationError) {
      logger.error(`Failed to check undertime status: ${error.message}`, error);
      throw error;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Unexpected error checking undertime status: ${message}`, error);
      throw new TimeCalculationError(`Failed to check if ${variance} is undertime: ${message}`);
    }
  }
};

/**
 * Safely calculate hours variance with error handling
 * @param totalHours Actual hours worked
 * @param targetHours Target hours
 * @returns Variance result with safety checking
 */
export const safeCalculateVariance = (totalHours: number, targetHours: number): { 
  variance: number; 
  isUndertime: boolean;
  hasError: boolean;
  errorMessage?: string;
} => {
  try {
    const variance = calculateHoursVariance(totalHours, targetHours);
    return {
      variance,
      isUndertime: variance < 0,
      hasError: false
    };
  } catch (error) {
    logger.error('Error in safe variance calculation', error);
    return {
      variance: 0,
      isUndertime: false,
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
};
