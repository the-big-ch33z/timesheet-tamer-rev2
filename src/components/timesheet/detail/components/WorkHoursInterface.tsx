
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./WorkHoursHeader";
import WorkHoursDisplay from "./WorkHoursDisplay";
import WorkHoursAlerts from "./WorkHoursAlerts";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { createTimeLogger } from "@/utils/time/errors";
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
    userId,
    onHoursChange
  });
  
  // Use TOIL calculations
  const { calculateToilForDay } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  // Log when entries change
  React.useEffect(() => {
    logger.debug(`Entries changed for date ${date.toISOString()}, count: ${entries.length}`);
  }, [entries, date]);
  
  // Calculate TOIL when entries, date, or schedule changes
  useEffect(() => {
    if (hasEntries && !isUndertime && isComplete) {
      // Only calculate TOIL if all required hours are met
      calculateToilForDay();
    }
  }, [hasEntries, isUndertime, isComplete, calculateToilForDay]);

  return (
    <div>
      <WorkHoursHeader hasEntries={hasEntries} />
      
      <WorkHoursDisplay
        startTime={startTime}
        endTime={endTime}
        totalHours={totalEnteredHours}
        calculatedHours={scheduledHours}
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
