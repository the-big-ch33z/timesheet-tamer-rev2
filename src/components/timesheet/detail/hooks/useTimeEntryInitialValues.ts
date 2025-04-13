
import { useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";

interface UseTimeEntryInitialValuesProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
}

/**
 * Hook to determine initial time values for new entries
 */
export const useTimeEntryInitialValues = ({
  entries,
  date,
  workSchedule
}: UseTimeEntryInitialValuesProps) => {
  // Get initial time values from entries or schedule
  const { initialStartTime, initialEndTime } = useMemo(() => {
    let startTime = "09:00";
    let endTime = "17:00";

    if (entries.length > 0) {
      startTime = entries[0].startTime || startTime;
      endTime = entries[0].endTime || endTime;
    } else if (workSchedule) {
      const scheduleInfo = getDayScheduleInfo(date, workSchedule);
      
      if (scheduleInfo?.hours) {
        startTime = scheduleInfo.hours.startTime || startTime;
        endTime = scheduleInfo.hours.endTime || endTime;
      }
    }
    
    return { initialStartTime: startTime, initialEndTime: endTime };
  }, [entries, date, workSchedule]);

  return {
    initialStartTime,
    initialEndTime
  };
};
