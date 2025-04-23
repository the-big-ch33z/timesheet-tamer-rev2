
import { TimeEntry } from "@/types";
import { calculateHoursFromTimes } from "@/utils/time/calculations/timeCalculations";

interface CompletionResult {
  isComplete: boolean;
  totalHours: number;
  scheduledHours: number;
  variance: number;
}

/**
 * Calculate completion status for time entries
 * 
 * @param entries The time entries to check
 * @param startTime The scheduled start time
 * @param endTime The scheduled end time
 * @param tolerance The tolerance for completion (default 0.01 hours = 36 seconds)
 * @returns Completion information
 */
export const calculateCompletion = (
  entries: TimeEntry[],
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  tolerance: number = 0.01
): CompletionResult => {
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Default result if we can't calculate scheduled hours
  if (!startTime || !endTime) {
    return {
      isComplete: false,
      totalHours,
      scheduledHours: 0,
      variance: 0
    };
  }

  try {
    // Calculate scheduled hours
    const scheduledHours = calculateHoursFromTimes(startTime, endTime);
    
    // Round to nearest 0.25 for consistency with UI display
    const roundedTotal = Math.round(totalHours * 4) / 4;
    const roundedScheduled = Math.round(scheduledHours * 4) / 4;
    
    // Calculate variance and check if complete
    const variance = Math.abs(roundedTotal - roundedScheduled);
    const isComplete = variance <= tolerance;
    
    return {
      isComplete,
      totalHours: roundedTotal,
      scheduledHours: roundedScheduled,
      variance
    };
  } catch (error) {
    console.error("Error calculating completion status:", error);
    return {
      isComplete: false,
      totalHours,
      scheduledHours: 0,
      variance: 0
    };
  }
};
