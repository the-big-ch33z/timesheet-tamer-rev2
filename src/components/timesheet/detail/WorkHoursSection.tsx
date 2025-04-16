
import React, { useEffect, useState } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./components/WorkHoursInterface";
import { Card } from "@/components/ui/card";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

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
  
  // Track when entries change for logging purposes
  const [entriesCount, setEntriesCount] = useState(entries.length);
  
  useEffect(() => {
    if (entries.length !== entriesCount) {
      logger.debug(`[WorkHoursSection] Entries count changed from ${entriesCount} to ${entries.length}`);
      setEntriesCount(entries.length);
    }
  }, [entries.length, entriesCount]);
  
  // Set up subscription to time events
  useEffect(() => {
    // Subscribe to entry creation/update events
    const unsubscribe = timeEventsService.subscribe('entry-created', (event) => {
      logger.debug(`[WorkHoursSection] Entry created event received`, event.payload);
    });
    
    return () => unsubscribe();
  }, []);
  
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
