
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./WorkHoursHeader";
import WorkHoursDisplay from "./WorkHoursDisplay";
import WorkHoursAlerts from "./WorkHoursAlerts";
import { useTimeEntryState } from "../hooks/useTimeEntryState";

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
  const {
    startTime,
    endTime,
    calculatedHours,
    totalHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    handleTimeChange
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    userId
  });

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
      />
      
      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime}
        hoursVariance={hoursVariance}
        interactive={interactive}
        date={date}
      />
    </div>
  );
};

export default WorkHoursInterface;
