
import { useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { getWorkdayTargetHours } from "@/utils/time/scheduleUtils";

interface UseTimeEntryStatsProps {
  entries: TimeEntry[];
  calculatedHours: number;
  workSchedule?: WorkSchedule;
}

interface TimeEntryStats {
  totalHours: number;
  remainingHours: number;
  overHours: number;
  dailyTarget: number;
  percentComplete: number;
}

/**
 * Hook to calculate and provide statistics about time entries for a day
 */
export const useTimeEntryStats = ({
  entries,
  calculatedHours,
  workSchedule
}: UseTimeEntryStatsProps): TimeEntryStats => {
  
  return useMemo(() => {
    // Sum up all hours from entries
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Get daily target from work schedule or use default
    const dailyTarget = workSchedule ? getWorkdayTargetHours(workSchedule) : 7.6;
    
    // Calculate remaining and over hours
    let remainingHours = dailyTarget - totalHours;
    let overHours = 0;
    
    if (remainingHours < 0) {
      overHours = Math.abs(remainingHours);
      remainingHours = 0;
    }
    
    // Calculate percentage complete
    const percentComplete = Math.min(100, (totalHours / dailyTarget) * 100);
    
    return {
      totalHours,
      remainingHours,
      overHours,
      dailyTarget,
      percentComplete
    };
  }, [entries, calculatedHours, workSchedule]);
};
