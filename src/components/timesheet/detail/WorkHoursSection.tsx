
import React, { useEffect, useState, useCallback } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";
import { useToilEffects } from "@/components/timesheet/detail/work-hours/useToilEffects";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { getHolidays } from "@/lib/holidays";
import { DebugPanel, WorkHoursContent } from "./work-hours-section";
import { useTOILTriggers } from "../hooks/useTOILTriggers";
import WorkHoursInterface from "./work-hours/WorkHoursInterface";

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
  const effectiveWorkSchedule = workSchedule || userContext.workSchedule;
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Get the holidays once
  const holidays = React.useMemo(() => getHolidays(), []);
  
  // Get day entries
  const dayEntries = getDayEntries(date);
  
  // Get TOIL calculation tools
  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries: dayEntries,
    workSchedule: effectiveWorkSchedule
  });

  // Use the extracted TOIL triggers hook
  const { triggerTOILCalculation } = useTOILTriggers({
    userId,
    date,
    entries: dayEntries,
    workSchedule: effectiveWorkSchedule,
    holidays
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
  
  // Call updated hook with object-based parameters
  useToilEffects({
    hasEntries: dayEntries.length > 0,
    leaveActive: false,
    toilActive: false,
    isComplete: true,
    calculateToilForDay,
    entriesCount: dayEntries.length,
    userId,
    date,
    entries: dayEntries,
    schedule: effectiveWorkSchedule
  });

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
    }
  }, [onCreateEntry, userId, date]);

  return (
    <div className="space-y-6 w-full">
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
    </div>
  );
};

export default React.memo(WorkHoursSection);
