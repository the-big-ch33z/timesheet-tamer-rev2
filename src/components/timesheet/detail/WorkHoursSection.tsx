
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/useTimeEntryContext";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./WorkHoursInterface";
import { Card } from "@/components/ui/card";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";

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
  // Use the TimeEntryContext directly
  const {
    getDayEntries,
    dayEntries: contextDayEntries
  } = useTimeEntryContext();

  // Get the user's work schedule from context if not provided
  const userContext = useUserTimesheetContext();
  const effectiveWorkSchedule = workSchedule || userContext.workSchedule;
  
  // Log when schedule changes
  useEffect(() => {
    if (effectiveWorkSchedule) {
      logger.debug(`[WorkHoursSection] Using work schedule: ${effectiveWorkSchedule.name || 'unnamed'}`);
    } else {
      logger.debug(`[WorkHoursSection] No work schedule available`);
    }
  }, [effectiveWorkSchedule]);

  // Get entries for the current day
  const dayEntries = getDayEntries(date);

  // Track when entries change for logging and notifications
  const [entriesCount, setEntriesCount] = useState(dayEntries.length);

  // Log initial entries data for debugging
  useEffect(() => {
    logger.debug(`[WorkHoursSection] Selected date: ${date.toISOString()}, entries: ${dayEntries.length}`);
  }, [date, dayEntries.length]);

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

  // Handle entry creation
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

  // Remove margin and padding from Card for flush layout
  return (
    <div className="space-y-6 w-full">
      {/* Card stretches to fill container, and has reduced or zero padding */}
      <Card className="p-0 m-0 w-full rounded-lg shadow-sm border border-gray-200">
        <WorkHoursInterface 
          date={date} 
          userId={userId} 
          interactive={interactive} 
          entries={dayEntries} 
          workSchedule={effectiveWorkSchedule} 
        />
      </Card>
      
      {/* Make entries section wide as well */}
      <div className="w-full">
        <Suspense fallback={<div className="text-center py-4">Loading entries...</div>}>
          <TimeEntryController 
            date={date} 
            userId={userId} 
            interactive={interactive} 
            onCreateEntry={handleCreateEntry} 
          />
        </Suspense>
      </div>
    </div>
  );
};

export default React.memo(WorkHoursSection);
