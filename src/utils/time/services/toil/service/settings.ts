
import { TOILServiceCore } from "./core";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_THRESHOLDS_KEY } from "../storage/constants";
import { ToilThresholds } from "@/types/monthEndToil";

const logger = createTimeLogger('TOILService-Settings');

// Default thresholds
export const DEFAULT_THRESHOLDS: ToilThresholds = {
  fullTime: 8,
  partTime: 6,
  casual: 4
};

/**
 * TOIL settings functionality
 */
export class TOILServiceSettings extends TOILServiceCore {
  /**
   * Fetch TOIL thresholds
   */
  public fetchToilThresholds(): ToilThresholds {
    try {
      const storedThresholds = localStorage.getItem(TOIL_THRESHOLDS_KEY);
      return storedThresholds ? JSON.parse(storedThresholds) : DEFAULT_THRESHOLDS;
    } catch (error) {
      logger.error("Error fetching TOIL thresholds:", error);
      return DEFAULT_THRESHOLDS;
    }
  }
  
  /**
   * Get TOIL threshold based on employment type
   * @param employmentType The type of employment (full-time, part-time, casual)
   * @returns The threshold value in hours
   */
  public getToilThreshold(employmentType: string): number {
    try {
      const thresholds = this.fetchToilThresholds();
      
      switch (employmentType.toLowerCase()) {
        case 'full-time':
        case 'fulltime':
        case 'full':
          return thresholds.fullTime;
        
        case 'part-time':
        case 'parttime':
        case 'part':
          return thresholds.partTime;
          
        case 'casual':
          return thresholds.casual;
          
        default:
          // Default to full-time threshold
          logger.warn(`Unknown employment type: ${employmentType}, using full-time threshold`);
          return thresholds.fullTime;
      }
    } catch (error) {
      logger.error(`Error getting TOIL threshold for ${employmentType}:`, error);
      
      // Default values if there's an error
      switch (employmentType.toLowerCase()) {
        case 'part-time':
        case 'parttime':
        case 'part':
          return 6;
        case 'casual':
          return 4;
        default:
          return 8; // Full-time default
      }
    }
  }
  
  /**
   * Save TOIL thresholds
   */
  public saveToilThresholds(thresholds: ToilThresholds): boolean {
    try {
      // Validate thresholds - must be positive numbers
      const validatedThresholds: ToilThresholds = {
        fullTime: this.validateThreshold(thresholds.fullTime, 8),
        partTime: this.validateThreshold(thresholds.partTime, 6),
        casual: this.validateThreshold(thresholds.casual, 4)
      };
      
      localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(validatedThresholds));
      logger.debug("TOIL thresholds saved:", validatedThresholds);
      return true;
    } catch (error) {
      logger.error("Error saving TOIL thresholds:", error);
      return false;
    }
  }
  
  /**
   * Reset TOIL thresholds to defaults
   */
  public resetToilThresholds(): ToilThresholds {
    localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(DEFAULT_THRESHOLDS));
    logger.debug("TOIL thresholds reset to defaults");
    return DEFAULT_THRESHOLDS;
  }
  
  /**
   * Validate a threshold value to ensure it's a positive number
   * @param value The threshold value to validate
   * @param defaultValue The default value to use if validation fails
   */
  private validateThreshold(value: any, defaultValue: number): number {
    // Must be a number and positive
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      logger.warn(`Invalid threshold value: ${value}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return value;
  }
}

// Export default thresholds
export { DEFAULT_THRESHOLDS as TOIL_DEFAULT_THRESHOLDS };
