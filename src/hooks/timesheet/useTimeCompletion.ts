
import { calculateCompletion } from '@/utils/timesheet/completionUtils';
import { TimeEntry } from '@/types';

/**
 * @deprecated Use calculateCompletion utility function directly instead
 * This hook is kept for backward compatibility
 */
export const useTimeCompletion = (
  entries: TimeEntry[],
  startTime: string | null | undefined,
  endTime: string | null | undefined
) => {
  // Since this is just a pure calculation now, we can simply return the result of our utility function
  return calculateCompletion(entries, startTime, endTime);
};
