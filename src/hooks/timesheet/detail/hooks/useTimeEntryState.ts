
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
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
}

// Helper function to normalize time input
const normalizeTimeInput = (time: string): string => {
  // For empty values, return as is
  if (!time) return time;
  
  // Handle single-digit hour case (e.g. "1" -> "01:00")
  if (/^\d$/.test(time)) {
    return `0${time}:00`;
  }
  
  // Handle hour-only case (e.g. "10" -> "10:00")
  if (/^\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  
  // Handle non-zero-padded hour with minutes (e.g. "9:30" -> "09:30")
  if (/^(\d):(\d{2})$/.test(time)) {
    const [hour, minute] = time.split(':');
    return `0${hour}:${minute}`;
  }
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  return time;
};

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
  
  // Add a handleTimeChange function to update time values with proper normalization
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    // Normalize the time value to ensure consistent format
    const normalizedValue = normalizeTimeInput(value);
    
    logger.debug(`[handleTimeChange] ${type} time: "${value}" normalized to "${normalizedValue}"`);
    
    if (type === 'start') {
      setStartTime(normalizedValue);
    } else {
      setEndTime(normalizedValue);
    }
  }, []);

  useEffect(() => {
    const calculate = async () => {
      try {
        if (!workSchedule) return;

        const scheduled = getScheduledHoursForDate(workSchedule, date);
        setScheduledHours(scheduled);

        if (startTime && endTime) {
          try {
            const entered = calculateHoursFromTimes(startTime, endTime);
            setTotalEnteredHours(entered);
            setHoursVariance(entered - scheduled);
            setIsUndertime(entered < scheduled);
            setIsComplete(entered >= scheduled);

            if (onHoursChange) {
              onHoursChange(entered);
            }
          } catch (error) {
            logger.error(`Error calculating hours: ${error}`);
            // Don't update state if calculation fails
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
  }, [startTime, endTime, date, workSchedule, getScheduledHoursForDate, onHoursChange]);

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
    handleTimeChange,  // Now included in the return object
  };
};
