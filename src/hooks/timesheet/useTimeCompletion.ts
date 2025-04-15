
import { useMemo } from 'react';
import { TimeEntry } from '@/types';
import { calculateHoursFromTimes } from '@/utils/time/calculations';

export const useTimeCompletion = (
  entries: TimeEntry[],
  startTime: string,
  endTime: string,
  tolerance: number = 0.1
) => {
  const calculatedTargetHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    try {
      return calculateHoursFromTimes(startTime, endTime);
    } catch {
      return 0;
    }
  }, [startTime, endTime]);

  const totalEntryHours = useMemo(() => 
    entries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    [entries]
  );

  const isComplete = useMemo(() => {
    if (calculatedTargetHours === 0) return false;
    const difference = Math.abs(calculatedTargetHours - totalEntryHours);
    return difference <= tolerance;
  }, [calculatedTargetHours, totalEntryHours, tolerance]);

  return {
    targetHours: calculatedTargetHours,
    totalHours: totalEntryHours,
    isComplete,
    hoursRemaining: Math.max(0, calculatedTargetHours - totalEntryHours)
  };
};
