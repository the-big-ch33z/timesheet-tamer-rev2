
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

  const handleToggleAction = useCallback((type: WorkHoursActionType) => {
    setActionStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Get break config for this day from schedule
  const breakConfig = useMemo(() => {
    if (!workSchedule) return { lunch: false, smoko: false };
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    return {
      lunch: !!(dayConfig && dayConfig.breaks && dayConfig.breaks.lunch),
      smoko: !!(dayConfig && dayConfig.breaks && dayConfig.breaks.smoko),
    };
  }, [workSchedule, date]);

  const hasLunchBreakInSchedule = breakConfig.lunch;
  const hasSmokoBreakInSchedule = breakConfig.smoko;

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

  // Calculate scheduled hours considering lunch override
  const scheduledHours = useMemo(() => {
    let hours = baseScheduledHours;
    if (hasLunchBreakInSchedule && actionStates.lunch) {
      // Lunch override: add 0.5h back to schedule
      hours += 0.5;
    }
    return hours;
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

  // Pass info about break config and any overrides to WorkHoursDisplay to show notification flags
  return (
    <div>
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
        breaksIncluded={{
          lunch: hasLunchBreakInSchedule && !actionStates.lunch,
          smoko: hasSmokoBreakInSchedule // Only based on config, no override for smoko
        }}
        overrideStates={{
          lunch: hasLunchBreakInSchedule ? actionStates.lunch : false,
        }}
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
