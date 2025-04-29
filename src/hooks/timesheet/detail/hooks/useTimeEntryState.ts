import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { calculateHoursFromTimes } from "@/utils/time/calculations/hoursCalculations";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

const logger = createTimeLogger('useTimeEntryState');

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  userId: string;
  onHoursChange?: (hours: number) => void;
}

interface TimeEntryState {
  startTime: string;
  endTime: string;
  scheduledHours: number;
  totalEnteredHours: number;
  hasEntries: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  isComplete: boolean;
}

export const useTimeEntryState = ({
  entries = [],
  date,
  workSchedule,
  interactive = true,
  userId,
  onHoursChange,
}: UseTimeEntryStateProps): TimeEntryState => {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [scheduledHours, setScheduledHours] = useState<number>(0);
  const [totalEnteredHours, setTotalEnteredHours] = useState<number>(0);
  const [hasEntries, setHasEntries] = useState<boolean>(false);
  const [hoursVariance, setHoursVariance] = useState<number>(0);
  const [isUndertime, setIsUndertime] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const { getScheduledHoursForDate } = useTimesheetWorkHours();

  useEffect(() => {
    const calculate = async () => {
      try {
        if (!workSchedule) return;

        const scheduled = getScheduledHoursForDate(workSchedule, date);
        setScheduledHours(scheduled);

        if (startTime && endTime) {
          const entered = calculateHoursFromTimes(startTime, endTime);
          setTotalEnteredHours(entered);
          setHoursVariance(entered - scheduled);
          setIsUndertime(entered < scheduled);
          setIsComplete(entered >= scheduled);

          if (onHoursChange) {
            onHoursChange(entered);
          }
        } else {
          setTotalEnteredHours(0);
          setHoursVariance(0);
          setIsUndertime(false);
          setIsComplete(false);
        }
      } catch (error) {
        logger.error("Error calculating hours:", error);
      }
    };

    calculate();
  }, [startTime, endTime, date, workSchedule, getScheduledHoursForDate, onHoursChange, logger]);

  useEffect(() => {
    setHasEntries(entries.length > 0);
  }, [entries]);

  return {
    startTime,
    endTime,
    scheduledHours,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    isComplete,
  };
};
