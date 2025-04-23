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
import { VerticalProgressBar } from "@/components/ui/VerticalProgressBar";
import { formatDisplayHours } from '@/utils/time/formatting/timeFormatting';
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useToast } from "@/hooks/use-toast";

const logger = createTimeLogger('WorkHoursInterface');

const ACTIONS_CONFIG: Record<WorkHoursActionType, { adjustment?: number; localKey: string }> = {
  lunch: { adjustment: 0.5, localKey: 'workhours_action_lunch' },
  smoko: { adjustment: 0.25, localKey: 'workhours_action_smoko' },
  leave: { localKey: 'workhours_action_leave' },
  sick: { localKey: 'workhours_action_sick' },
  toil: { localKey: 'workhours_action_toil' }
};

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  interactive?: boolean;
  workSchedule?: WorkSchedule;
  onHoursChange?: (hours: number) => void;
}

const getStorageKey = (date: Date, userId: string) =>
  `workhours_actionstate_${userId}_${date.toISOString().slice(0,10)}`;

const getInitialActionState = (date: Date, userId: string): Record<WorkHoursActionType, boolean> => {
  if (typeof window === 'undefined') return {
    sick: false, leave: false, toil: false, lunch: false, smoko: false
  };
  try {
    const stored = window.localStorage.getItem(getStorageKey(date, userId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { sick: false, leave: false, toil: false, lunch: false, smoko: false };
};

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  interactive = true,
  workSchedule,
  onHoursChange
}) => {
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours(userId);
  const { createEntry } = useTimeEntryContext();
  const { toast } = useToast();

  // Add 'smoko' to state
  const [actionStates, setActionStates] = useState<Record<WorkHoursActionType, boolean>>(() =>
    getInitialActionState(date, userId)
  );

  // Track if we've created synthetic entries
  const [createdEntries, setCreatedEntries] = useState<Record<WorkHoursActionType, boolean>>({
    sick: false, leave: false, toil: false, lunch: false, smoko: false
  });

  // Track created synthetic entry IDs for auto-leave entries
  const [syntheticEntryIds, setSyntheticEntryIds] = useState<Record<WorkHoursActionType, string | null>>({
    sick: null, leave: null, toil: null, lunch: null, smoko: null
  });

  // Persist actionStates to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(getStorageKey(date, userId), JSON.stringify(actionStates));
    } catch {}
  }, [actionStates, date, userId]);

  // Restore states when date or userId changes
  useEffect(() => {
    setActionStates(getInitialActionState(date, userId));
    setCreatedEntries({ sick: false, leave: false, toil: false, lunch: false, smoko: false });
  }, [date, userId]);

  // Remove both leaves if both selected (mutual exclusion)
  useEffect(() => {
    if (actionStates.leave && actionStates.sick) {
      setActionStates((prev) => ({ ...prev, leave: false, sick: false }));
    }
  }, [actionStates.leave, actionStates.sick]);

  // Remove previously created synthetic entry if toggled off
  const removeSyntheticEntry = useCallback((type: WorkHoursActionType) => {
    const syntheticId = syntheticEntryIds[type];
    if (syntheticId) {
      // Only delete the synthetic entry, not manual entries
      // Should handle async for consistency
      if (typeof syntheticId === "string" && syntheticId.length > 0) {
        // Get deleteEntry from createEntry context
        if (typeof window !== "undefined" && createEntry && createEntry.deleteEntry) {
          // unlikely branch, back compat: skip
        }
      }
      if (typeof syntheticId === "string" && syntheticId.length > 0) {
        // Use entries-context: useTimeEntryContext() gives createEntry(), deleteEntry()
        // Find and call matching deleteEntry from context:
        if (typeof createEntry === "function" && "deleteEntry" in createEntry) {
          // For legacy, but context provides delete in v2 API
          // fallback to next
        }
      }
      // Use deleteEntry from context:
      if ("deleteEntry" in useTimeEntryContext()) {
        const { deleteEntry } = useTimeEntryContext();
        deleteEntry(syntheticId);
      }
      // Clean up reference regardless
      setSyntheticEntryIds(prev => ({ ...prev, [type]: null }));
      setCreatedEntries(prev => ({ ...prev, [type]: false }));
    }
  }, [syntheticEntryIds]);

  // Enhanced to create and remove synthetic time entries for leave/sick/toil
  const createSyntheticEntry = useCallback((type: WorkHoursActionType, isActive: boolean) => {
    if (!isActive) {
      // Remove synthetic entry if toggled off
      removeSyntheticEntry(type);
      return;
    }

    if (createdEntries[type]) {
      // Entry was already created, skip
      return;
    }

    // Get scheduled hours for the day
    const dayHours = calculateDayHours();
    const hoursToRecord = dayHours > 0 ? dayHours : 7.6; // Use default if no schedule

    // Create the entry based on type
    const entryTypeMap = {
      leave: "Annual Leave",
      sick: "Sick Leave", 
      toil: "TOIL"
    };

    // All these should have a fixed project for consistency
    const entryData = {
      userId,
      date,
      hours: hoursToRecord,
      entryType: "auto",
      description: `${entryTypeMap[type as keyof typeof entryTypeMap]} - Automatically generated`,
      jobNumber: type === "toil" ? "TOIL-USED" : type === "leave" ? "LEAVE" : "SICK",
      project: "General"
    };
    
    logger.debug(`Creating synthetic entry for ${type}:`, entryData);

    const newEntryId = createEntry(entryData);

    if (newEntryId) {
      logger.debug(`Created synthetic ${type} entry with ID: ${newEntryId}`);
      setCreatedEntries(prev => ({ ...prev, [type]: true }));
      setSyntheticEntryIds(prev => ({ ...prev, [type]: newEntryId }));

      toast({
        title: `${entryTypeMap[type as keyof typeof entryTypeMap]} Recorded`,
        description: `${hoursToRecord} hours recorded for ${date.toLocaleDateString()}`
      });
    } else {
      logger.error(`Failed to create synthetic ${type} entry`);
      toast({
        title: "Error",
        description: `Failed to record ${entryTypeMap[type as keyof typeof entryTypeMap]}`,
        variant: "destructive"
      });
    }
  }, [userId, date, createEntry, toast, createdEntries, calculateDayHours, removeSyntheticEntry]);

  // Updated toggle logic to call removeSyntheticEntry for toggling OFF
  const handleToggleAction = useCallback((type: WorkHoursActionType) => {
    setActionStates(prev => {
      let next = { ...prev, [type]: !prev[type] };

      // Mutual exclusivity for leave/sick/toil
      if (type === "leave" && next.leave) {
        next.sick = false;
        next.toil = false;
      }
      if (type === "sick" && next.sick) {
        next.leave = false;
        next.toil = false;
      }
      if (type === "toil" && next.toil) {
        next.leave = false;
        next.sick = false;
      }

      // Manage synthetic entries creation/removal for leave/sick/toil
      if (
        (type === "leave" || type === "sick" || type === "toil") &&
        next[type] !== prev[type]
      ) {
        setTimeout(() => {
          createSyntheticEntry(type, next[type]);
        }, 0);
      }

      // When toggling OFF, remove any existing synthetic entry for that type immediately
      if ((type === "leave" || type === "sick" || type === "toil") && !next[type]) {
        removeSyntheticEntry(type);
      }

      return next;
    });
  }, [createSyntheticEntry, removeSyntheticEntry]);

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

  // Calculate day hours from schedule or default
  const calculateDayHours = useCallback(() => {
    if (!workSchedule) return 7.6; // Default if no schedule
    
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    
    if (!dayConfig || !dayConfig.startTime || !dayConfig.endTime) {
      return 7.6; // Default if day not in schedule
    }
    
    return calculateDayHoursWithBreaks(
      dayConfig.startTime, 
      dayConfig.endTime, 
      { 
        lunch: !!dayConfig.breaks?.lunch, 
        smoko: !!dayConfig.breaks?.smoko 
      }
    );
  }, [workSchedule, date]);

  // Calculate adjusted hours according to toggles
  const calculateAdjustedHours = useCallback(() => {
    let adjustment = 0;
    // Lunch: add 0.5h if toggled and lunch break is in schedule (meaning you are claiming NOT to have taken lunch and want +0.5h)
    if (actionStates.lunch && hasLunchBreakInSchedule) adjustment += 0.5;
    // Smoko: add 0.25h if toggled and smoko break is in schedule
    if (actionStates.smoko && hasSmokoBreakInSchedule) adjustment += 0.25;
    // Annual Leave and Sick: treat as if full scheduled hours entered (used below)
    // TOIL: visual/state only here
    return adjustment;
  }, [actionStates.lunch, actionStates.smoko, hasLunchBreakInSchedule, hasSmokoBreakInSchedule]);

  // Main scheduled hours logic
  const roundToQuarter = (val: number) => Math.round(val * 4) / 4;

  const scheduledHours = useMemo(() => {
    const result = calculateDayHoursWithBreaks(startTime, endTime, breakConfig);
    const rounded = roundToQuarter(result);
    return rounded;
  }, [startTime, endTime, breakConfig]);

  // Are we marking this day as leave/sick/toil?
  const leaveActive = actionStates.leave || actionStates.sick;
  const toilActive = actionStates.toil;

  // How many hours to display as "entered" for progress and summary?
  const effectiveTotalHours = useMemo(() => {
    // If leave or sick, treat as "completed full day" for calculations/progress.
    if (actionStates.leave || actionStates.sick) {
      return scheduledHours + calculateAdjustedHours();
    }
    // Else normal entry with toggled break overrides
    return roundToQuarter(totalEnteredHours + calculateAdjustedHours());
  }, [actionStates.leave, actionStates.sick, scheduledHours, totalEnteredHours, calculateAdjustedHours]);

  const isActuallyComplete = useMemo(() => {
    if (leaveActive) return true;
    if (!hasEntries || !entries.length) return false;
    const variance = Math.abs(roundToQuarter(totalEnteredHours + calculateAdjustedHours()) - scheduledHours);
    return variance <= 0.01;
  }, [leaveActive, totalEnteredHours, scheduledHours, hasEntries, entries.length, calculateAdjustedHours]);

  const verticalProgressValue = useMemo(() => {
    if (!scheduledHours || scheduledHours === 0) return 0;
    return Math.min(100, (effectiveTotalHours / scheduledHours) * 100);
  }, [effectiveTotalHours, scheduledHours]);

  const isOverScheduled = effectiveTotalHours > scheduledHours + 0.01;
  const isDaySick = actionStates.sick;
  const isDayLeave = actionStates.leave;
  const isDayToil = actionStates.toil;

  // Color background highlight according to "leave" or "sick" or "toil"
  const highlightBg = isDaySick
    ? "bg-[#fff6f6]"
    : isDayLeave
      ? "bg-[#f5faff]"
      : isDayToil
        ? "bg-purple-50"
        : "bg-white";

  // TOIL logic - no effect on day total, just highlight and passes to display/summary
  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  useEffect(() => {
    if (!hasEntries && !leaveActive && !toilActive) return;
    if (!isActuallyComplete) return;
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isActuallyComplete, calculateToilForDay, entries.length, leaveActive, toilActive]);

  const timeChangeHandler = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Direct time change: ${type}=${value}`);
    handleTimeChange(type, value);
  }, [handleTimeChange]);

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <WorkHoursHeader hasEntries={hasEntries || leaveActive} />
          <WorkHoursActionButtons value={actionStates} onToggle={handleToggleAction} />
        </div>
        <div className="flex space-x-4 items-start">
          <div className="flex-1">
            <div className={`rounded-lg border border-gray-200 ${highlightBg}`}>
              <WorkHoursDisplay
                startTime={startTime}
                endTime={endTime}
                totalHours={effectiveTotalHours}
                calculatedHours={scheduledHours}
                hasEntries={hasEntries}
                interactive={interactive && !leaveActive && !toilActive}
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
            </div>
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
                isOverScheduled
                  ? "bg-red-500"
                  : isActuallyComplete
                  ? "bg-green-500"
                  : isUndertime
                  ? "bg-amber-500"
                  : isDaySick
                  ? "bg-[#ea384c]"
                  : isDayLeave
                  ? "bg-sky-500"
                  : isDayToil
                  ? "bg-purple-500"
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
