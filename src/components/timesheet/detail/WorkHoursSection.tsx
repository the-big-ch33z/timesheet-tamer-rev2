
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/useTimeEntryContext";
import TimeEntryController from "../entry-control/TimeEntryController";
import { createTimeLogger } from "@/utils/time/errors";
import WorkHoursInterface from "./WorkHoursInterface";
import { Card } from "@/components/ui/card";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { useUserTimesheetContext } from "@/contexts/timesheet/user-context/UserTimesheetContext";
import { useToilEffects } from "@/components/timesheet/detail/work-hours/useToilEffects";
import { TOILDebugPanel } from "@/components/debug/TOILDebugPanel"; 
import { TOILDataValidator } from "@/components/debug/DataValidator";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { toilService } from "@/utils/time/services/toil";
import { getHolidays } from "@/lib/holidays";

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
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [manualCalculationTrigger, setManualCalculationTrigger] = useState(0);
  
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

  // Track entries count for change detection
  const [entriesCount, setEntriesCount] = useState(dayEntries.length);

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
    userId,
    date,
    entries: dayEntries,
    schedule: effectiveWorkSchedule,
    isComplete: true
  });

  useEffect(() => {
    logger.debug(`[WorkHoursSection] Selected date: ${date.toISOString()}, entries: ${dayEntries.length}`);
  }, [date, dayEntries.length]);

  useEffect(() => {
    if (dayEntries.length !== entriesCount) {
      logger.debug(`[WorkHoursSection] Entries count changed from ${entriesCount} to ${dayEntries.length}`);
      setEntriesCount(dayEntries.length);

      // Publish event about hours change
      timeEventsService.publish('hours-updated', {
        entriesCount: dayEntries.length,
        date: date.toISOString(),
        userId
      });
      
      // Explicitly trigger TOIL calculation when entries change
      if (dayEntries.length > 0 && effectiveWorkSchedule) {
        logger.debug('[WorkHoursSection] Triggering TOIL calculation due to entries change');
        
        // Properly debounced call via useTOILCalculations hook
        calculateToilForDay()
          .then(summary => {
            if (summary) {
              logger.debug('[WorkHoursSection] TOIL calculation successful:', summary);
              // Dispatch additional event to ensure UI updates
              timeEventsService.publish('toil-updated', {
                userId,
                date: date.toISOString(),
                summary
              });
            }
          })
          .catch(err => {
            logger.error('[WorkHoursSection] TOIL calculation failed:', err);
          });
      }
    }
  }, [dayEntries.length, entriesCount, date, userId, calculateToilForDay, effectiveWorkSchedule]);

  // Manual TOIL calculation trigger
  useEffect(() => {
    if (manualCalculationTrigger > 0 && effectiveWorkSchedule) {
      logger.debug('[WorkHoursSection] Manual TOIL calculation triggered');
      
      // Direct call to TOIL service for immediate calculation
      toilService.calculateAndStoreTOIL(
        dayEntries,
        date,
        userId,
        effectiveWorkSchedule,
        holidays
      ).then(summary => {
        logger.debug('[WorkHoursSection] Manual TOIL calculation complete:', summary);
        
        // Dispatch both event types for maximum compatibility
        timeEventsService.publish('toil-updated', {
          userId,
          date: date.toISOString(),
          summary
        });
        
        // Also dispatch through the DOM event system
        window.dispatchEvent(new CustomEvent('toil:summary-updated', { 
          detail: summary
        }));
      });
    }
  }, [manualCalculationTrigger, dayEntries, date, userId, effectiveWorkSchedule, holidays]);

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

  // Manual TOIL calculation trigger function
  const triggerTOILCalculation = useCallback(() => {
    setManualCalculationTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6 w-full">
      {showDebugPanel && (
        <>
          <TOILDebugPanel 
            userId={userId} 
            date={date}
            onCalculateTOIL={triggerTOILCalculation}
            isCalculating={isCalculating}
          />
          <TOILDataValidator userId={userId} />
        </>
      )}
      
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
