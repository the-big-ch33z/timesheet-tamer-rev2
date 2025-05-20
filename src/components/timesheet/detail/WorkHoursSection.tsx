
import React, { useEffect, useState, useCallback, useRef } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";
import { DebugPanel, WorkHoursContent } from "./work-hours-section";
import WorkHoursInterface from "./work-hours/WorkHoursInterface";
import TimeEntryController from "../entry-control/TimeEntryController";
import WorkHoursActions from "./components/WorkHoursActions";
import { format } from 'date-fns';
import { useUnifiedTOIL } from "@/hooks/timesheet/toil/useUnifiedTOIL";

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
  const { getDayEntries } = useTimeEntryContext();
  const userContext = useUserTimesheetContext();
  
  // Log the schedule assignment for debugging
  useEffect(() => {
    logger.debug("WorkHoursSection mounted with user context and props:", {
      propWorkSchedule: workSchedule ? `${workSchedule.name}(${workSchedule.id})` : 'none',
      contextWorkSchedule: userContext.workSchedule ? `${userContext.workSchedule.name}(${userContext.workSchedule.id})` : 'none',
      date: format(date, 'yyyy-MM-dd'),
      userId
    });
  }, [workSchedule, userContext.workSchedule, date, userId]);

  // Use the schedule from props first, then fall back to the context
  const effectiveWorkSchedule = workSchedule || userContext.workSchedule;
  
  // If we still don't have a schedule, log a warning
  useEffect(() => {
    if (!effectiveWorkSchedule) {
      logger.warn(`No work schedule available for user ${userId} - TOIL calculations may be incorrect`);
    } else {
      logger.debug(`Using effective work schedule: ${effectiveWorkSchedule.name || 'unnamed'} (${effectiveWorkSchedule.id})`);
    }
  }, [effectiveWorkSchedule, userId]);

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  
  // Get day entries
  const dayEntries = getDayEntries(date);
  
  // Use our new unified TOIL hook
  const {
    calculateToilForDay,
    triggerTOILCalculation,
    isCalculating
  } = useUnifiedTOIL({
    userId,
    date,
    entries: dayEntries,
    workSchedule: effectiveWorkSchedule,
    options: {
      autoRefresh: true
    }
  });

  useEffect(() => {
    if (effectiveWorkSchedule) {
      logger.debug(`[WorkHoursSection] Using work schedule: ${effectiveWorkSchedule.name || 'unnamed'}`);
    } else {
      logger.debug(`[WorkHoursSection] No work schedule available`);
    }
    
    // Check for developer mode by looking for URL param or localStorage flag
    const isDevMode = window.location.search.includes('devMode=true') || 
                      localStorage.getItem('timesheet-dev-mode') === 'true';
    setShowDebugPanel(isDevMode);
  }, [effectiveWorkSchedule]);

  // Handle entry creation
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
      
      // Trigger calculation after a short delay
      setTimeout(() => {
        triggerTOILCalculation();
      }, 200);
    }
  }, [onCreateEntry, userId, date, triggerTOILCalculation]);

  const handleAddEntry = useCallback(() => {
    setShowEntryForm(true);
  }, []);

  return (
    <div className="space-y-4 w-full">
      {showDebugPanel && (
        <DebugPanel 
          userId={userId} 
          date={date}
          onCalculateTOIL={triggerTOILCalculation}
          isCalculating={isCalculating}
        />
      )}
      
      <WorkHoursInterface 
        date={date}
        userId={userId}
        entries={dayEntries}
        workSchedule={effectiveWorkSchedule}
        interactive={interactive}
      />
      
      {interactive && (
        <WorkHoursActions onAddEntry={handleAddEntry} />
      )}

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
