
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import { useTimeEntryState } from "./hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTimeEntryStats } from "@/hooks/timesheet/useTimeEntryStats";
import HoursStats from "./components/HoursStats";

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
    calculatedHours,
    totalHours,
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
  
  // Use our unified stats hook
  const stats = useTimeEntryStats({
    entries,
    calculatedHours
  });

  // When entries change, ensure we're in sync
  useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
    
    // Call onHoursChange callback if provided
    if (onHoursChange) {
      onHoursChange(stats.totalHours);
    }
  }, [entries, date, stats.totalHours, onHoursChange]);

  // Effect to update work hours when startTime or endTime changes
  useEffect(() => {
    if (interactive && startTime && endTime) {
      logger.debug(`Saving work hours: start=${startTime}, end=${endTime}`);
      saveWorkHoursForDate(date, startTime, endTime, userId);
    }
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate]);

  const enhancedHandleTimeChange = (type: 'start' | 'end', value: string) => {
    logger.debug(`Time input changed: ${type}=${value}`);
    handleTimeChange(type, value);
    
    // Save immediately on change for immediate feedback
    const updatedStartTime = type === 'start' ? value : startTime;
    const updatedEndTime = type === 'end' ? value : endTime;
    
    if (updatedStartTime && updatedEndTime) {
      logger.debug(`Immediately saving updated work hours: start=${updatedStartTime}, end=${updatedEndTime}`);
      saveWorkHoursForDate(date, updatedStartTime, updatedEndTime, userId);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <WorkHoursHeader hasEntries={hasEntries} />
        
        <WorkHoursDisplay
          startTime={startTime}
          endTime={endTime}
          totalHours={totalHours}
          calculatedHours={calculatedHours}
          hasEntries={hasEntries}
          interactive={interactive}
          onTimeChange={enhancedHandleTimeChange}
          isComplete={isComplete}
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
      
      <HoursStats 
        calculatedHours={calculatedHours}
        totalHours={stats.totalHours}
        hasEntries={stats.hasEntries}
        hoursVariance={stats.hoursVariance}
        isUndertime={stats.isUndertime}
      />
    </div>
  );
};

export default WorkHoursInterface;
