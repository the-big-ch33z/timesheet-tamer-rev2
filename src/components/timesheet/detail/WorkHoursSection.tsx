
import React, { useEffect, useState, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./WorkHoursInterface";
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
  
  // Update entry count when entries change
  useEffect(() => {
    if (entries.length !== entriesCount) {
      logger.debug(`[WorkHoursSection] Entries count changed from ${entriesCount} to ${entries.length}`);
      setEntriesCount(entries.length);
      
      // Notify other components that entries have changed
      timeEventsService.publish('hours-updated', { 
        entriesCount: entries.length,
        date: date.toISOString(),
        userId
      });
    }
  }, [entries.length, entriesCount, date, userId]);
  
  // Handle entry creation - stabilize with useCallback
  const handleCreateEntry = useCallback((startTime: string, endTime: string, hours: number) => {
    if (onCreateEntry) {
      logger.debug(`[WorkHoursSection] Creating entry: ${startTime}-${endTime}, ${hours} hours`);
      onCreateEntry(startTime, endTime, hours);
      
      // Publish event after creating entry
      timeEventsService.publish('entry-created', {
        startTime,
        endTime,
        hours,
        userId,
        date: date.toISOString()
      });
    }
  }, [onCreateEntry, userId, date]);
  
  // Memoize hours change handler
  const handleHoursChange = useCallback((hours: number) => {
    logger.debug(`[WorkHoursSection] Hours changed: ${hours}`);
  }, []);
  
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
            onHoursChange={handleHoursChange}
          />
        </Card>
        
        <TimeEntryController
          date={date}
          userId={userId}
          interactive={interactive}
          onCreateEntry={handleCreateEntry}
        />
      </div>
    </TimeEntryProvider>
  );
};

export default React.memo(WorkHoursSection);
