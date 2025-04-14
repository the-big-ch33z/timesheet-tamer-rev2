
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryContext";
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
  // Add console log to track interactive state
  console.debug(`[WorkHoursSection] Rendering with interactive=${interactive}, entries=${entries.length}, date=${date.toISOString()}`);
  
  return (
    <TimeEntryProvider selectedDate={date} userId={entries[0]?.userId}>
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
