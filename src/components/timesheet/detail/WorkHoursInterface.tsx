import React, { useEffect, useState, useCallback, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons, { WorkHoursActionType } from "./components/WorkHoursActionButtons";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { getWeekDay, getFortnightWeek, calculateDayHoursWithBreaks } from "@/utils/time/scheduleUtils";

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

  const breakConfig = useMemo(() => {
    if (!workSchedule) return { lunch: false, smoko: false };
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    return {
      lunch: !!(dayConfig?.breaks?.lunch),
      smoko: !!(dayConfig?.breaks?.smoko),
    };
  }, [workSchedule, date]);

  const hasLunchBreakInSchedule = breakConfig.lunch;
  const hasSmokoBreakInSchedule = breakConfig.smoko;

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

  // ✅ NEW: Accurately recalculate scheduled hours with break config
  const scheduledHours = useMemo(() => {
    return calculateDayHoursWithBreaks(startTime, endTime, breakConfig);
  }, [startTime, endTime, breakConfig]);

  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  useEffect(() => {
    if (!hasEntries || !isComplete || !entries.length) return;
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isComplete, calculateToilForDay, entries.length]);

  const timeChangeHandler = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Direct time change: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

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
          lunch: hasLunchBreakInSchedule,
          smoko: hasSmokoBreakInSchedule
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
