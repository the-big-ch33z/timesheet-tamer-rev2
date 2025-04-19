
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./WorkHoursHeader";
import WorkHoursDisplay from "./WorkHoursDisplay";
import WorkHoursAlerts from "./WorkHoursAlerts";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";

const logger = createTimeLogger('WorkHoursInterface');

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  interactive?: boolean;
  workSchedule?: WorkSchedule;
}

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  interactive = true,
  workSchedule
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

  // When entries change, ensure we're in sync
  useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
  }, [entries, date]);

  return (
    <div>
      <WorkHoursHeader hasEntries={hasEntries} />
      
      <WorkHoursDisplay
        startTime={startTime}
        endTime={endTime}
        totalHours={totalHours}
        calculatedHours={calculatedHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={handleTimeChange}
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
  );
};

export default WorkHoursInterface;
