
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons, { WorkHoursActionType } from "./components/WorkHoursActionButtons";
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

  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  // Memoize action states to prevent unnecessary re-renders
  const [actionStates, setActionStates] = useState<Record<WorkHoursActionType, boolean>>({
    sick: false,
    leave: false,
    toil: false,
    lunch: false,
  });

  const handleToggleAction = useCallback((type: WorkHoursActionType) => {
    setActionStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Memoized version of notifyHoursChange to prevent excessive callbacks
  const notifyHoursChange = useCallback(() => {
    if (onHoursChange) {
      onHoursChange(totalEnteredHours);
    }
  }, [onHoursChange, totalEnteredHours]);
  
  // Notify hours change when entries change
  useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
    notifyHoursChange();
  }, [entries, date, notifyHoursChange]);

  // Debounce work hours saving to reduce localStorage operations
  useEffect(() => {
    if (!interactive || !startTime || !endTime) return;
    
    logger.debug(`Saving work hours: start=${startTime}, end=${endTime}`);
    
    const timeoutId = setTimeout(() => {
      saveWorkHoursForDate(date, startTime, endTime, userId);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate]);

  // Memoized handler for time changes
  const enhancedHandleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Time input changed: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  // Trigger TOIL calculation only when a completed timesheet has stabilized (debounced)
  useEffect(() => {
    // Only calculate TOIL when entries are complete
    if (!hasEntries || !isComplete) return;
    
    // Use a regular timeout instead of nested requestAnimationFrame + setTimeout
    const timeoutId = setTimeout(() => {
      calculateToilForDay();
    }, 500); // Longer delay to allow UI to settle first
    
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isComplete, calculateToilForDay]);

  return (
    <div>
      {/* Floating action buttons above header */}
      <div className="flex justify-center mb-1">
        <WorkHoursActionButtons value={actionStates} onToggle={handleToggleAction} />
      </div>

      <WorkHoursHeader hasEntries={hasEntries} />

      <WorkHoursDisplay
        startTime={startTime}
        endTime={endTime}
        totalHours={totalEnteredHours}
        calculatedHours={scheduledHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={enhancedHandleTimeChange}
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

      {/* Optionally show loading indicator during TOIL calculation */}
      {isCalculating && (
        <div className="mt-2 text-xs text-blue-500 text-center animate-pulse">
          Calculating time accruals...
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkHoursInterface);
