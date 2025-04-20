
import { calculateHoursFromTimes } from '@/utils/time/calculations';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('completionUtils');

/**
 * Calculates whether a set of time entries satisfies the expected hours
 * based on start and end times
 * 
 * @param entries Array of entries with optional hours property
 * @param startTime Optional start time string in format "HH:MM" 
 * @param endTime Optional end time string in format "HH:MM"
 * @returns Object with completion status and related metrics
 */
export const calculateCompletion = (
  entries: { hours?: number }[],
  startTime: string | null | undefined,
  endTime: string | null | undefined
) => {
  // No entries means not complete
  if (!entries.length) {
    return {
      isComplete: false,
      hasEntries: false,
      totalEntryHours: 0,
      expectedHours: 0,
      variance: 0
    };
  }

  // Calculate total hours from entries
  const totalEntryHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // If we don't have start and end times, we can't calculate expected hours
  if (!startTime || !endTime) {
    logger.debug('No start/end times provided for completion check');
    return {
      isComplete: false,
      hasEntries: true,
      totalEntryHours,
      expectedHours: 0,
      variance: 0
    };
  }

  // Calculate expected hours from start and end times
  let expectedHours;
  try {
    expectedHours = calculateHoursFromTimes(startTime, endTime);
    logger.debug(`Completion check - Expected: ${expectedHours}h, Actual: ${totalEntryHours}h`);
  } catch (error) {
    logger.error('Error calculating hours:', error);
    expectedHours = 0;
  }

  const variance = Math.abs(expectedHours - totalEntryHours);
  const isComplete = variance < 0.1; // Less than 6 minutes difference is considered complete

  if (isComplete) {
    logger.debug('Day marked as complete - hours match expected total');
  }

  return {
    isComplete,
    hasEntries: true,
    totalEntryHours,
    expectedHours,
    variance
  };
};
