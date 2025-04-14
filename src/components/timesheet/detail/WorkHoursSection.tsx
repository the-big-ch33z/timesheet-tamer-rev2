
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import TimeEntryManager from "./managers/TimeEntryManager";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('WorkHoursSection');

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
  // Get userId from entries if available or from localStorage
  const currentUserId = window.localStorage.getItem('currentUserId') || 'default-user';
  const userId = entries.length > 0 ? entries[0].userId : currentUserId;
  
  logger.debug(`[WorkHoursSection] Rendering for date: ${date}, with ${entries.length} entries, userId: ${userId}`);
  
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
