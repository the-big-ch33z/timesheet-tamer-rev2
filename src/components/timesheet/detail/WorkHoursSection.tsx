
import React, { useEffect, useState, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./WorkHoursInterface";
import { Card } from "@/components/ui/card";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

const logger = createTimeLogger('WorkHoursSection');

interface WorkHoursSectionProps {
  date: Date;
  userId: string;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({
  date,
  userId,
  workSchedule,
  interactive = true,
  onCreateEntry
}) => {
  // Use the TimeEntryContext directly since we're already wrapped in a provider
  const { entries, getDayEntries } = useTimeEntryContext();
  
  // Get entries for the current day
  const dayEntries = getDayEntries(date);
  
  // Track when entries change for logging purposes
  const [entriesCount, setEntriesCount] = useState(dayEntries.length);
  
  // Update entry count when entries change
  useEffect(() => {
    if (dayEntries.length !== entriesCount) {
      logger.debug(`[WorkHoursSection] Entries count changed from ${entriesCount} to ${dayEntries.length}`);
      setEntriesCount(dayEntries.length);
      
      // Notify other components that entries have changed
      timeEventsService.publish('hours-updated', { 
        entriesCount: dayEntries.length,
        date: date.toISOString(),
        userId
      });
    }
  }, [dayEntries.length, entriesCount, date, userId]);
  
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
    <div className="space-y-6">
      <Card className="p-4">
        <WorkHoursInterface 
          date={date}
          userId={userId}
          interactive={interactive}
          entries={dayEntries}
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
  );
};

export default React.memo(WorkHoursSection);
