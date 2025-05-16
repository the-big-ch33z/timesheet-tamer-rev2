
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { getSummaryCacheKey } from "./core";
import { attemptStorageOperation } from "./core";

const logger = createTimeLogger('TOIL-Storage-SummaryOperations');

/**
 * Store a TOIL summary in local storage
 * 
 * @param summary - The TOIL summary to store
 * @returns Promise that resolves to the stored summary if successful, null otherwise
 */
export async function storeTOILSummary(summary: TOILSummary): Promise<TOILSummary | null> {
  try {
    if (!summary || !summary.userId || !summary.monthYear) {
      logger.error('Invalid TOIL summary data provided');
      return null;
    }
    
    // Create a cache key for this summary
    const cacheKey = getSummaryCacheKey(summary.userId, summary.monthYear);
    
    // Store the summary in local storage
    await attemptStorageOperation(
      () => localStorage.setItem(cacheKey, JSON.stringify(summary)),
      'storing TOIL summary'
    );
    
    logger.debug(`TOIL summary successfully stored for ${summary.userId} - ${summary.monthYear}`);
    return summary;
  } catch (error) {
    logger.error(`Error storing TOIL summary: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
