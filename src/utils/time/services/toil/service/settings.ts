
import { TOILServiceCore } from "./core";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_THRESHOLDS_KEY } from "../storage/constants";
import { ToilThresholds } from "@/types/monthEndToil";

const logger = createTimeLogger('TOILService-Settings');

// Default thresholds
const DEFAULT_THRESHOLDS: ToilThresholds = {
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
   * Save TOIL thresholds
   */
  public saveToilThresholds(thresholds: ToilThresholds): boolean {
    try {
      localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(thresholds));
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
    return DEFAULT_THRESHOLDS;
  }
}
