
import React, { useEffect, useState, useCallback, useRef } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";
import { useToilEffects } from "./hooks/useToilEffects";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { getHolidays } from "@/lib/holidays";
import { DebugPanel, WorkHoursContent } from "./work-hours-section";
import { useTOILTriggers } from "@/hooks/timesheet/useTOILTriggers";
import WorkHoursInterface from "./work-hours/WorkHoursInterface";
import TimeEntryController from "../entry-control/TimeEntryController";
import { TOILSummary } from "@/types/toil";
import WorkHoursActions from "./components/WorkHoursActions";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';

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
  const [showEntryForm, setShowEntryForm] = useState(false);
  
  // Add protection against multiple rapid calculations
  const lastCalculationTime = useRef<number>(0);
  const calculationInProgress = useRef<boolean>(false);
  
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
  
  // Fix: Create a wrapper function that conforms to the expected type
  const calculateToilWrapper = useCallback(async (): Promise<void> => {
    try {
      // Add circuit breaker for calculations
      const now = Date.now();
      if (calculationInProgress.current) {
        logger.debug('Skipping TOIL calculation - another one is in progress');
        return undefined;
      }
      
      // Prevent calculations more frequently than every 3 seconds
      if (now - lastCalculationTime.current < 3000) {
        logger.debug('Skipping TOIL calculation due to rate limiting');
        return undefined;
      }
      
      // Mark calculation as in progress and update last calculation time
      calculationInProgress.current = true;
      lastCalculationTime.current = now;
      
      const summary = await calculateToilForDay();
      
      // Only notify if we actually got a summary
      if (summary) {
        logger.debug(`Broadcasting TOIL summary update after day calculation`);
        
        // Use the event bus with debounce to prevent excessive event firing
        eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, {
          ...summary,
          timestamp: new Date(),
          monthYear: format(date, 'yyyy-MM')
        }, { debounce: 1000 });  // Add 1 second debounce
      }
      
      // Release the lock
      calculationInProgress.current = false;
      
      // Explicitly return undefined to satisfy the Promise<void> return type
      return undefined;
    } catch (error) {
      logger.error('Error in TOIL calculation wrapper:', error);
      // Release the lock even on error
      calculationInProgress.current = false;
      // Still return undefined even in case of error
      return undefined;
    }
  }, [calculateToilForDay, date]);

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
  
  // Use the unified useToilEffects hook with the full set of parameters
  useToilEffects({
    userId,
    date,
    entries: dayEntries,
    schedule: effectiveWorkSchedule,
    hasEntries: dayEntries.length > 0,
    leaveActive: false,
    toilActive: false,
    isComplete: true,
    calculateToilForDay: calculateToilWrapper,
    entriesCount: dayEntries.length
  });

  // Handle entry creation with debounce protection
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
      
      // Use a longer timeout and only trigger calculation once
      const triggerTime = Date.now();
      if (triggerTime - lastCalculationTime.current > 5000) {
        setTimeout(() => {
          triggerTOILCalculation();
        }, 1000);
      }
    }
  }, [onCreateEntry, userId, date, triggerTOILCalculation, lastCalculationTime]);

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
