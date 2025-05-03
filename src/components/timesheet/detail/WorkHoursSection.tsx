import React, { useEffect, useState, useCallback, Suspense } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/useTimeEntryContext";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./WorkHoursInterface";
import { Card } from "@/components/ui/card";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";
import { useToilEffects } from "@/components/timesheet/detail/work-hours/useToilEffects"; // ✅ PATCH: import the new version

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
  const {
    getDayEntries,
    dayEntries: contextDayEntries
  } = useTimeEntryContext();

  const userContext = useUserTimesheetContext();
  const effectiveWorkSchedule = workSchedule || userContext.workSchedule;

  useEffect(() => {
    if (effectiveWorkSchedule) {
      logger.debug(`[WorkHoursSection] Using work schedule: ${effectiveWorkSchedule.name || 'unnamed'}`);
    } else {
      logger.debug(`[WorkHoursSection] No work schedule available`);
    }
  }, [effectiveWorkSchedule]);

  const dayEntries = getDayEntries(date);

  // ✅ Updated PATCH: Call TOIL recalculation hook with safe arguments
  useToilEffects({
    userId,
    date,
    entries: dayEntries,
    schedule: effectiveWorkSchedule
  });

  const [entriesCount, setEntriesCount] = useState(dayEntries.length);

  useEffect(() => {
    logger.debug(`[WorkHoursSection] Selected date: ${date.toISOString()}, entries: ${dayEntries.length}`);
  }, [date, dayEntries.length]);

  useEffect(() => {
    if (dayEntries.length !== entriesCount) {
      logger.debug(`[WorkHoursSection] Entries count changed from ${entriesCount} to ${dayEntries.length}`);
      setEntriesCount(dayEntries.length);

      timeEventsService.publish('hours-updated', {
        entriesCount: dayEntries.length,
        date: date.toISOString(),
        userId
      });
    }
  }, [dayEntries.length, entriesCount, date, userId]);

  const handleCreateEntry = useCallback((startTime: string, endTime: string, hours: number) => {
    if (onCreateEntry) {
      logger.debug(`[WorkHoursSection] Creating entry: ${startTime}-${endTime}, ${hours} hours`);
      onCreateEntry(startTime, endTime, hours);

      timeEventsService.publish('entry-created', {
        startTime,
        endTime,
        hours,
        userId,
        date: date.toISOString()
      });
    }
  }, [onCreateEntry, userId, date]);

  return (
    <div className="space-y-6 w-full">
      <Card className="p-0 m-0 w-full rounded-lg shadow-sm border border-gray-200">
        <WorkHoursInterface 
          date={date} 
          userId={userId} 
          interactive={interactive} 
          entries={dayEntries} 
          workSchedule={effectiveWorkSchedule} 
        />
      </Card>

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
