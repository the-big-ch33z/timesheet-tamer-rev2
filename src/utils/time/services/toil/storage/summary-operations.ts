
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { getSummaryCacheKey } from "./core";

const logger = createTimeLogger('TOIL-Storage-SummaryOperations');

/**
 * Store a TOIL summary in local storage cache
 * 
 * @param summary The TOIL summary to store
 * @returns Promise that resolves to the stored summary if successful, null otherwise
 */
export async function storeTOILSummary(summary: TOILSummary): Promise<TOILSummary | null> {
  try {
    const { userId, monthYear } = summary;
    const cacheKey = getSummaryCacheKey(userId, monthYear);
    
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    
    logger.debug(`TOIL summary successfully stored for ${userId} - ${monthYear}`);
    return summary;
  } catch (error) {
    logger.error(`Error storing TOIL summary: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
