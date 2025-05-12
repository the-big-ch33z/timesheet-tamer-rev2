
import { 
  TOILRecord, TOILSummary, TOILUsage 
} from "@/types/toil";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  clearSummaryCache,
  getStorageTOILSummary
} from "../storage";
import { 
  TOIL_SUMMARY_CACHE_KEY,
  DEBOUNCE_PERIOD
} from "../storage/constants";
import { dispatchTOILEvent } from "../events";

const logger = createTimeLogger('TOILService-Core');

// Track the last TOIL operation time for debouncing
let lastTOILOperationTime = 0;

/**
 * Core functionality for the TOIL service
 */
export class TOILServiceCore {
  protected calculationQueueEnabled: boolean = true;
  
  constructor(calculationQueueEnabled: boolean = true) {
    this.calculationQueueEnabled = calculationQueueEnabled;
    logger.debug(`TOILServiceCore initialized with calculationQueueEnabled=${calculationQueueEnabled}`);
  }
  
  /**
   * Clear all TOIL-related caches
   */
  public clearCache(): void {
    try {
      logger.debug('Clearing TOIL cache');
      
      // Clear all summary caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
          localStorage.removeItem(key);
          logger.debug(`Removed cache key: ${key}`);
        }
      }
      
      clearSummaryCache();
      
      logger.debug('TOIL cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing TOIL cache:', error);
    }
  }

  /**
   * Get TOIL summary for a user and month
   */
  public getTOILSummary(userId: string, monthYear: string | Date): TOILSummary {
    try {
      // Normalize input to string format
      const normalizedMonthYear = monthYear instanceof Date 
        ? format(monthYear, 'yyyy-MM')
        : monthYear;
      
      logger.debug(`Getting TOIL summary for user ${userId}, month ${normalizedMonthYear}`);
      
      // Use the unified implementation from storage/queries.ts
      const summary = getStorageTOILSummary(userId, normalizedMonthYear);
      
      logger.debug(`TOIL service returning summary for ${userId} - ${normalizedMonthYear}:`, summary);
      
      // Extra validation to catch potential issues
      if (summary) {
        const { accrued, used, remaining } = summary;
        
        // Check for NaN or invalid values
        if (isNaN(accrued) || isNaN(used) || isNaN(remaining)) {
          logger.error(`Invalid numeric values in TOIL summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
          
          // Return a corrected summary
          return {
            userId,
            monthYear: normalizedMonthYear,
            accrued: isFinite(accrued) ? accrued : 0,
            used: isFinite(used) ? used : 0,
            remaining: isFinite(remaining) ? remaining : 0
          };
        }
      }
      
      return summary || {
        userId,
        monthYear: normalizedMonthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
    } catch (error) {
      logger.error(`Error getting TOIL summary from service: ${error instanceof Error ? error.message : String(error)}`, error);
      
      // Return a valid but empty summary on error
      return {
        userId,
        monthYear: typeof monthYear === 'string' ? monthYear : format(monthYear, 'yyyy-MM'),
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
  }
  
  /**
   * Helper method to check if an operation should be debounced
   * @returns true if the operation should proceed, false if it should be skipped
   */
  protected shouldDebounceOperation(): boolean {
    const now = Date.now();
    if (now - lastTOILOperationTime < DEBOUNCE_PERIOD) {
      logger.debug('Operation debounced due to timing');
      return true;
    }
    lastTOILOperationTime = now;
    return false;
  }
  
  /**
   * Update the last operation time for debouncing
   */
  protected updateDebounceTimestamp(): void {
    lastTOILOperationTime = Date.now();
  }
}
