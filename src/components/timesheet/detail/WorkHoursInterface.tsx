import React, { useEffect, useState, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons from "./components/WorkHoursActionButtons";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTimeEntryStats } from "@/hooks/timesheet/useTimeEntryStats";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";

const logger = createTimeLogger('WorkHoursInterface');

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  interactive?: boolean;
  workSchedule?: WorkSchedule;
  onHoursChange?: (hours: number) => void;
}

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  interactive = true,
  workSchedule,
  onHoursChange
}) => {
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours(userId);
  
  const {
    startTime,
    endTime,
    scheduledHours,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    isComplete,
    handleTimeChange
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    userId
  });

  const { calculateToilForDay } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  const [actionStates, setActionStates] = useState<Record<"sick" | "leave" | "toil" | "lunch", boolean>>({
    sick: false,
    leave: false,
    toil: false,
    lunch: false,
  });

  const handleToggleAction = useCallback((type: "sick" | "leave" | "toil" | "lunch") => {
    setActionStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  useEffect(() => {
    console.log("[WorkHoursInterface] Action States:", actionStates);
  }, [actionStates]);

  const notifyHoursChange = useCallback(() => {
    if (onHoursChange) {
      onHoursChange(totalEnteredHours);
    }
  }, [onHoursChange, totalEnteredHours]);
  
  useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
    notifyHoursChange();
  }, [entries, date, notifyHoursChange]);

  useEffect(() => {
    if (!interactive || !startTime || !endTime) return;
    
    logger.debug(`Saving work hours: start=${startTime}, end=${endTime}`);
    
    const timeoutId = setTimeout(() => {
      saveWorkHoursForDate(date, startTime, endTime, userId);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate]);

  const enhancedHandleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Time input changed: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  useEffect(() => {
    if (!hasEntries || !isComplete) return;
    
    if (typeof window !== 'undefined') {
      const animationId = window.requestAnimationFrame(() => {
        setTimeout(() => {
          calculateToilForDay();
        }, 100);
      });
      
      return () => {
        window.cancelAnimationFrame(animationId);
      };
    }
  }, [hasEntries, isComplete, calculateToilForDay]);

  return (
    <div>
      <WorkHoursHeader
        hasEntries={hasEntries}
        actionStates={actionStates}
        onToggleAction={handleToggleAction}
      />

      <WorkHoursDisplay
        startTime={startTime}
        endTime={endTime}
        totalHours={totalEnteredHours}
        calculatedHours={scheduledHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={handleTimeChange}
        isComplete={isComplete}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
      />

      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime}
        hoursVariance={hoursVariance}
        interactive={interactive}
        date={date}
        isComplete={isComplete}
      />
    </div>
  );
};

export default WorkHoursInterface;
