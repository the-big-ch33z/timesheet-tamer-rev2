
import { useMemo } from "react";
import { TimeEntry } from "@/types";
import { calculateHoursVariance, isUndertime } from "@/utils/time/calculations";

interface UseTimeEntryStatsProps {
  entries: TimeEntry[];
  calculatedHours: number;
}

/**
 * Hook for calculating time entry statistics and metrics
 */
export const useTimeEntryStats = ({
  entries,
  calculatedHours
}: UseTimeEntryStatsProps) => {
  // Calculate total hours from entries
  const totalHours = useMemo(() => 
    entries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    [entries]
  );

  // Calculate hours variance (difference between expected and actual hours)
  const hoursVariance = useMemo(() => 
    calculateHoursVariance(totalHours, calculatedHours),
    [totalHours, calculatedHours]
  );

  // Check if there are any entries
  const hasEntries = entries.length > 0;

  // Check if the user is under their scheduled hours
  const isUndertimeValue = useMemo(() => 
    isUndertime(hoursVariance),
    [hoursVariance]
  );

  return {
    totalHours,
    hoursVariance,
    hasEntries,
    isUndertime: isUndertimeValue
  };
};
