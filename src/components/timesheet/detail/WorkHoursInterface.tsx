
import React, { useEffect, useCallback, memo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
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
  // Use the unified timesheet work hours hook
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours(userId);
  
  // Use the time entry state management hook
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
  
  // Use our unified stats hook with memoization
  // const stats = useTimeEntryStats({
  //   entries,
  //   calculatedHours: scheduledHours
  // });

  // Use TOIL calculations with performance optimizations
  const { calculateToilForDay } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  // When entries change, ensure we're in sync - use callback for stability
  const notifyHoursChange = useCallback(() => {
    if (onHoursChange) {
      onHoursChange(totalEnteredHours);
    }
  }, [onHoursChange, totalEnteredHours]);
  
  // This effect runs when entries change
  useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
    notifyHoursChange();
  }, [entries, date, notifyHoursChange]);

  // Effect to update work hours when startTime or endTime changes
  useEffect(() => {
    if (!interactive || !startTime || !endTime) return;
    
    logger.debug(`Saving work hours: start=${startTime}, end=${endTime}`);
    
    // Debounce saving to prevent excessive storage operations
    const timeoutId = setTimeout(() => {
      saveWorkHoursForDate(date, startTime, endTime, userId);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate]);

  // Memoize the time change handler for better performance
  const enhancedHandleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Time input changed: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  // Calculate TOIL when entries are present and complete - with performance optimizations
  useEffect(() => {
    if (!hasEntries || !isComplete) return;
    
    // Don't calculate TOIL on every render - use requestAnimationFrame to defer
    if (typeof window !== 'undefined') {
      const animationId = window.requestAnimationFrame(() => {
        // Further delay with setTimeout to avoid blocking the main thread
        setTimeout(() => {
          calculateToilForDay();
        }, 100);
      });
      
      return () => {
        // Cancel the animation frame if the component unmounts
        window.cancelAnimationFrame(animationId);
      };
    }
  }, [hasEntries, isComplete, calculateToilForDay]);

  return (
    <div className="space-y-4">
      <div>
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
          // Passing in new status values for summary:
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
    </div>
  );
};

// Use memo to prevent unnecessary re-renders of the entire component
export default memo(WorkHoursInterface);

