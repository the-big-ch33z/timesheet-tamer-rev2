
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons, { WorkHoursActionType } from "./components/WorkHoursActionButtons";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTimeEntryStats } from "@/hooks/timesheet/useTimeEntryStats";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";

// Import helpers for getting day breaks config from schedule
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";

const logger = createTimeLogger('WorkHoursInterface');

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  interactive?: boolean;
  workSchedule?: WorkSchedule;
  onHoursChange?: (hours: number) => void;
}

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  interactive = true,
  workSchedule,
  onHoursChange
}) => {
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours(userId);

  // State for current action (lunch override)
  const [actionStates, setActionStates] = useState<Record<WorkHoursActionType, boolean>>({
    sick: false,
    leave: false,
    toil: false,
    lunch: false,
  });

  // Memoize action states to prevent unnecessary re-renders
  const handleToggleAction = useCallback((type: WorkHoursActionType) => {
    setActionStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // ===== CALCULATE if a lunch break is configured for the scheduled day =====
  // Find out if this date (from workSchedule) normally has an unpaid lunch break
  const hasLunchBreakInSchedule = useMemo(() => {
    if (!workSchedule) return false;
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    return !!(dayConfig && dayConfig.breaks && dayConfig.breaks.lunch);
  }, [workSchedule, date]);

  // Use the main time entry state management hook
  const {
    startTime,
    endTime,
    scheduledHours: baseScheduledHours,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    isComplete,
    handleTimeChange
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    userId,
    onHoursChange
  });

  // "Lunch override" means: If user presses the button, they worked through lunch, so 30min is ADDED BACK to scheduled hours.
  // If not pressed AND schedule says lunch is unpaid => subtract 0.5 as usual.
  // If override pressed => do not subtract 0.5 or, equivalently, add it back.
  const scheduledHours = useMemo(() => {
    if (!hasLunchBreakInSchedule) return baseScheduledHours;
    if (actionStates.lunch) {
      // Normally would subtract 0.5, so add it back if user worked through lunch
      return baseScheduledHours + 0.5;
    }
    // Lunch is unpaid as per schedule (no override): leave baseScheduledHours
    return baseScheduledHours;
  }, [baseScheduledHours, hasLunchBreakInSchedule, actionStates.lunch]);

  // Trigger TOIL calculation when a completed timesheet has stabilized
  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  useEffect(() => {
    // Only calculate TOIL when entries are complete
    if (!hasEntries || !isComplete || !entries.length) return;
    // Use a timeout to allow UI to settle first
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400); 
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isComplete, calculateToilForDay, entries.length]);

  // A simplified, more direct time change handler
  const timeChangeHandler = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Direct time change: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  return (
    <div>
      {/* Floating action buttons above header */}
      <div className="flex justify-center mb-1">
        <WorkHoursActionButtons value={actionStates} onToggle={handleToggleAction} />
      </div>

      <WorkHoursHeader hasEntries={hasEntries} />

      <WorkHoursDisplay
        startTime={startTime}
        endTime={endTime}
        totalHours={totalEnteredHours}
        calculatedHours={scheduledHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={timeChangeHandler}
        isComplete={isComplete}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
      />

      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime}
        hoursVariance={hoursVariance}
        interactive={interactive}
        date={date}
        isComplete={isComplete}
      />

      {/* Show loading indicator during TOIL calculation with better UX */}
      {isCalculating && (
        <div className="mt-2 text-xs text-blue-500 text-center animate-pulse flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calculating time accruals...
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkHoursInterface);
