
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { calculateDailyTOIL } from "./calculation/dailyTOIL";
import { getTOILSummary } from "./storage/core";
import { storeTOILSummary } from "./storage/summary-operations";
import { dispatchTOILEvent } from "./events";

const logger = createTimeLogger('TOIL-BatchProcessing');

/**
 * Perform a single TOIL calculation for one day.
 * 
 * @param entries - Time entries to calculate TOIL for
 * @param date - The date to calculate TOIL for
 * @param userId - The user ID
 * @param workSchedule - Optional work schedule for the user
 * @param holidays - Optional array of holidays
 * @returns The TOIL summary or null if calculation failed
 */
export async function performSingleCalculation(
  entries: TimeEntry[],
  date: Date,
  userId: string,
  workSchedule?: WorkSchedule,
  holidays: Holiday[] = []
): Promise<TOILSummary | null> {
  try {
    logger.debug(`Performing single calculation for ${userId} on ${date.toISOString().slice(0, 10)}`);
    
    // Calculate TOIL hours for the day
    const toilHours = calculateDailyTOIL({
      entries,
      date,
      workSchedule,
      userId
    });
    
    // Store the summary for the month
    const monthYear = date.toISOString().slice(0, 7); // YYYY-MM format
    
    // Get existing summary or create new one
    const existingSummary = getTOILSummary(userId, monthYear);
    const summary: TOILSummary = {
      userId,
      monthYear,
      accrued: (existingSummary?.accrued || 0) + (toilHours > 0 ? toilHours : 0),
      used: existingSummary?.used || 0,
      remaining: (existingSummary?.remaining || 0) + (toilHours > 0 ? toilHours : 0)
    };
    
    // Store the updated summary
    const storedSummary = await storeTOILSummary(summary);
    
    // Dispatch events to notify subscribers
    if (storedSummary) {
      dispatchTOILEvent(storedSummary);
    }
    
    return storedSummary;
  } catch (error) {
    logger.error(`Error in performSingleCalculation: ${error instanceof Error ? error.message : String(error)}`, error);
    return null;
  }
}
