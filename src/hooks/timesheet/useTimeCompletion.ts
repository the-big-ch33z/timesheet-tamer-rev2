
import { useMemo } from 'react';
import { TimeEntry } from '@/types';
import { calculateHoursFromTimes } from '@/utils/time/calculations';

/**
 * Hook to determine if time entries are complete based on work hours
 */
export const useTimeCompletion = (
  entries: TimeEntry[],
  startTime: string | null | undefined,
  endTime: string | null | undefined
) => {
  const result = useMemo(() => {
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
    } catch (error) {
      console.error('Error calculating hours:', error);
      expectedHours = 0;
    }

    const variance = Math.abs(expectedHours - totalEntryHours);
    const isComplete = variance < 0.1; // Less than 6 minutes difference is considered complete

    return {
      isComplete,
      hasEntries: true,
      totalEntryHours,
      expectedHours,
      variance
    };
  }, [entries, startTime, endTime]);

  return result;
};
