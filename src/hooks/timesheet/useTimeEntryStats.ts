
import { useCallback, useMemo } from 'react';
import { TimeEntry } from '@/types';

export interface TimeEntryStats {
  totalHours: number;
  hasEntries: boolean;
  hoursVariance: number;
  isUndertime: boolean;
}

/**
 * Hook to calculate statistics for time entries
 */
export const useTimeEntryStats = ({
  entries,
  calculatedHours
}: {
  entries: TimeEntry[];
  calculatedHours: number;
}): TimeEntryStats => {
  // Calculate total hours from entries
  const totalHours = useMemo(() => {
    if (!entries || entries.length === 0) return 0;
    
    return entries.reduce((sum, entry) => {
      return sum + (typeof entry.hours === 'number' ? entry.hours : 0);
    }, 0);
  }, [entries]);

  // Check if there are any entries
  const hasEntries = entries && entries.length > 0;
  
  // Calculate the variance between scheduled and actual hours
  const hoursVariance = useMemo(() => {
    if (calculatedHours === 0) return 0;
    return totalHours - calculatedHours;
  }, [totalHours, calculatedHours]);
  
  // Determine if undertime
  const isUndertime = hoursVariance < 0;

  return {
    totalHours,
    hasEntries,
    hoursVariance,
    isUndertime
  };
};

export default useTimeEntryStats;
