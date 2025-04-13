
/**
 * Variance calculation utilities
 * Functions for calculating differences between actual and expected hours
 */

// Create a logger instance for variance calculations
const logger = {
  error: (message: string, error?: any) => console.error(`[VarianceCalculations] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[VarianceCalculations] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[VarianceCalculations] ${message}`, data)
};

/**
 * Calculate hours variance between total and target
 * @param totalHours Actual hours worked
 * @param targetHours Target hours
 * @returns Variance (negative means undertime)
 * @throws Error if inputs are invalid
 */
export const calculateHoursVariance = (totalHours: number, targetHours: number): number => {
  try {
    // Input validation
    if (isNaN(totalHours)) {
      throw new Error(`Invalid total hours: ${totalHours}. Must be a number.`);
    }
    
    if (isNaN(targetHours)) {
      throw new Error(`Invalid target hours: ${targetHours}. Must be a number.`);
    }
    
    const variance = totalHours - targetHours;
    logger.debug(`Calculated hours variance: ${variance} (${totalHours} - ${targetHours})`);
    
    return variance;
  } catch (error) {
    logger.error("Error calculating hours variance:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to calculate hours variance: ${error}`);
    }
  }
};

/**
 * Check if hours variance indicates undertime
 * @param variance Hours variance
 * @returns true if undertime (negative variance)
 * @throws Error if input is invalid
 */
export const isUndertime = (variance: number): boolean => {
  try {
    // Input validation
    if (isNaN(variance)) {
      throw new Error(`Invalid variance value: ${variance}. Must be a number.`);
    }
    
    const result = variance < 0;
    logger.debug(`Checking if ${variance} is undertime: ${result}`);
    
    return result;
  } catch (error) {
    logger.error("Error checking undertime status:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to check undertime status: ${error}`);
    }
  }
};
