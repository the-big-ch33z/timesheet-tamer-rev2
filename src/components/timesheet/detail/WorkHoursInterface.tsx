
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons from "./components/WorkHoursActionButtons";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { getWeekDay, getFortnightWeek, calculateDayHoursWithBreaks } from "@/utils/time/scheduleUtils";
import { VerticalProgressBar } from "@/components/ui/VerticalProgressBar";

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

  const roundToQuarter = (val: number) => Math.round(val * 4) / 4;

  const scheduledHours = useMemo(() => {
    console.log('[DEBUG] startTime:', startTime);
    console.log('[DEBUG] endTime:', endTime);
    console.log('[DEBUG] breakConfig:', breakConfig);
    const result = calculateDayHoursWithBreaks(startTime, endTime, breakConfig);
    const rounded = roundToQuarter(result);
    console.log('[DEBUG] calculated scheduled hours (rounded to 0.25):', rounded);
    return rounded;
  }, [startTime, endTime, breakConfig]);

  // Update the completion check logic to use a tighter tolerance
  const isActuallyComplete = useMemo(() => {
    if (!hasEntries || !entries.length) return false;
    const variance = Math.abs(roundToQuarter(totalEnteredHours) - scheduledHours);
    return variance <= 0.01; // Use a much tighter tolerance for completion
  }, [totalEnteredHours, scheduledHours, hasEntries, entries.length]);

  const verticalProgressValue = useMemo(() => {
    if (!scheduledHours || scheduledHours === 0) return 0;
    return Math.min(100, (roundToQuarter(totalEnteredHours) / scheduledHours) * 100);
  }, [totalEnteredHours, scheduledHours]);

  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  useEffect(() => {
    if (!hasEntries || !isActuallyComplete || !entries.length) return;
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isActuallyComplete, calculateToilForDay, entries.length]);

  const timeChangeHandler = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Direct time change: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <WorkHoursHeader hasEntries={hasEntries} />
          <WorkHoursActionButtons value={actionStates} onToggle={handleToggleAction} />
        </div>

        <div className="flex space-x-4 items-start">
          <div className="flex-1">
            <WorkHoursDisplay
              startTime={startTime}
              endTime={endTime}
              totalHours={totalEnteredHours}
              calculatedHours={scheduledHours}
              hasEntries={hasEntries}
              interactive={interactive}
              onTimeChange={timeChangeHandler}
              isComplete={isActuallyComplete}
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
              isComplete={isActuallyComplete}
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
          <div className="flex flex-col items-center justify-start min-h-[210px]">
            <VerticalProgressBar
              value={verticalProgressValue}
              height={90}
              width={13}
              barColor={
                isActuallyComplete
                  ? "bg-green-500"
                  : isUndertime
                  ? "bg-amber-500"
                  : scheduledHours > 0 && totalEnteredHours > scheduledHours
                  ? "bg-red-500"
                  : "bg-blue-500"
              }
              bgColor="bg-gray-100"
            />
            <span className="text-[0.70rem] mt-1 mx-auto text-gray-500 text-center font-medium">{verticalProgressValue.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkHoursInterface);
