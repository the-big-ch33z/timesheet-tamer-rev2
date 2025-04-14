
import { useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";

interface UseTimeEntryInitialValuesProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
}

/**
 * Hook to get initial time values from entries or schedule
 */
export const useTimeEntryInitialValues = ({
  entries,
  date,
  workSchedule
}: UseTimeEntryInitialValuesProps) => {
  // Find initial times from entries or schedule
  const { initialStartTime, initialEndTime } = useMemo(() => {
    // If we have entries, get start/end times from the first entry
    if (entries.length > 0) {
      const firstEntry = entries[0];
      if (firstEntry.startTime && firstEntry.endTime) {
        return {
          initialStartTime: firstEntry.startTime,
          initialEndTime: firstEntry.endTime
        };
      }
    }

    // If there are no entries but there's a schedule, get times from there
    if (workSchedule) {
      const scheduleInfo = getDayScheduleInfo(date, workSchedule);
      if (scheduleInfo?.hours) {
        return {
          initialStartTime: scheduleInfo.hours.startTime,
          initialEndTime: scheduleInfo.hours.endTime
        };
      }
    }

    // Default to empty
    return { initialStartTime: "", initialEndTime: "" };
  }, [entries, date, workSchedule]);

  return { initialStartTime, initialEndTime };
};
