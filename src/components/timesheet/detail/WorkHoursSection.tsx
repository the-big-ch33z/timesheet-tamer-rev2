
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./components/WorkHoursInterface";
import { Card } from "@/components/ui/card";

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
  const currentUserId = window.localStorage.getItem('currentUserId') || 'default-user';
  const userId = entries.length > 0 ? entries[0].userId : currentUserId;
  
  logger.debug(`[WorkHoursSection] Rendering for date: ${date}, with ${entries.length} entries, userId: ${userId}`);
  
  return (
    <TimeEntryProvider selectedDate={date} userId={userId}>
      <div className="space-y-6">
        <Card className="p-4">
          <WorkHoursInterface 
            date={date}
            userId={userId}
            interactive={interactive}
            entries={entries}
            workSchedule={workSchedule}
          />
        </Card>
        
        <TimeEntryController
          date={date}
          userId={userId}
          interactive={interactive}
        />
      </div>
    </TimeEntryProvider>
  );
};

export default WorkHoursSection;
