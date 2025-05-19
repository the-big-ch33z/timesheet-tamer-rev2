
import { TOILSummary } from "@/types/toil";
import { getSummaryCacheKey } from "./core";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOIL-Summary-Operations');

/**
 * Store TOIL summary for a specific user and month
 * @param summary The TOIL summary to store
 * @returns The stored summary
 */
export function storeTOILSummary(summary: TOILSummary): TOILSummary {
  try {
    if (!summary || !summary.userId || !summary.monthYear) {
      logger.error("Invalid TOIL summary provided", summary);
      throw new Error("Invalid TOIL summary");
    }
    
    const cacheKey = getSummaryCacheKey(summary.userId, summary.monthYear);
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    logger.debug(`Stored TOIL summary for ${summary.userId} in ${summary.monthYear}:`, 
      { accrued: summary.accrued, used: summary.used, remaining: summary.remaining });
    
    return summary;
  } catch (error) {
    logger.error("Error storing TOIL summary:", error);
    throw error;
  }
}
