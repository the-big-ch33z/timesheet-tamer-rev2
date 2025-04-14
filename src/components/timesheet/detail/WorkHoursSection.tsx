
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import TimeEntryManager from "./managers/TimeEntryManager";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({
  entries,
  date,
  workSchedule,
  interactive = true,
  onCreateEntry
}) => {
  // Get userId from entries if available
  const userId = entries.length > 0 ? entries[0].userId : undefined;
  
  return (
    <TimeEntryProvider selectedDate={date} userId={userId}>
      <TimeEntryManager
        entries={entries}
        date={date}
        workSchedule={workSchedule}
        interactive={interactive}
        onCreateEntry={onCreateEntry}
      />
    </TimeEntryProvider>
  );
};

export default WorkHoursSection;
