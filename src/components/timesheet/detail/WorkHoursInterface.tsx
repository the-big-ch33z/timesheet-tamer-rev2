
import React, { useMemo } from "react";
import { createTimeLogger } from "@/utils/time/errors";
import { useWorkHoursActions } from "./hooks/useWorkHoursActions";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { useWorkHoursCalculation } from "./hooks/useWorkHoursCalculation";
import { WorkHoursInterfaceProps } from "./work-hours/types";
import WorkHoursContent from "./work-hours/WorkHoursContent";
import { useHoursCalculation } from "./work-hours/useHoursCalculation";
import { useBreakAdjustments } from "./work-hours/useBreakAdjustments";
import { useToilEffects } from "./work-hours/useToilEffects";

const logger = createTimeLogger('WorkHoursInterface');

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  interactive = true,
  workSchedule,
  onHoursChange
}) => {
  const { calculateDayHours, breakConfig, hasLunchBreakInSchedule, hasSmokoBreakInSchedule } 
    = useWorkHoursCalculation(date, workSchedule);

  const {
    actionStates,
    handleToggleAction
  } = useWorkHoursActions(date, userId);

  const {
    startTime,
    endTime,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    handleTimeChange
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    userId,
    onHoursChange
  });

  const { calculateToilForDay, isCalculating } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  // Calculate scheduled hours 
  const scheduledHours = useMemo(() => {
    const result = calculateDayHours();
    return Math.round(result * 4) / 4; // Round to quarter hour
  }, [calculateDayHours]);

  // Get break adjustments
  const { breakAdjustment, breakConfig: breakConfigState, displayBreakConfig } = useBreakAdjustments(
    startTime, 
    endTime, 
    actionStates, 
    hasLunchBreakInSchedule, 
    hasSmokoBreakInSchedule
  );

  // Determine if leave or TOIL is active
  const leaveActive = actionStates.leave || actionStates.sick;
  const toilActive = actionStates.toil;

  // Calculate hours based on entries or time inputs
  const { calculatedTimeHours, isComplete, isOverScheduled } = useHoursCalculation(
    startTime,
    endTime,
    breakAdjustment,
    scheduledHours,
    totalEnteredHours,
    hasEntries
  );

  // Calculate effective total hours - FIXED to show 0 when no entries
  const effectiveTotalHours = useMemo(() => {
    if (actionStates.leave || actionStates.sick) {
      return scheduledHours;
    }
    
    // Use entered hours if we have entries, otherwise 0
    return hasEntries ? Math.round(totalEnteredHours * 4) / 4 : 0;
  }, [actionStates.leave, actionStates.sick, scheduledHours, totalEnteredHours, hasEntries]);

  // Set up TOIL calculation effects - Fixed to use object parameter pattern
  useToilEffects({
    hasEntries,
    leaveActive,
    toilActive,
    isComplete,
    calculateToilForDay,
    entriesCount: entries.length
  });

  // Fix: Make sure we're reporting completion status consistently
  const isActuallyComplete = useMemo(() => {
    if (!hasEntries) return false;
    
    if (actionStates.leave || actionStates.sick) {
      // Leave days are always considered complete if they have entries
      return true;
    }
    
    // Round values to avoid floating point comparison issues
    const roundedTotal = Math.round(totalEnteredHours * 4) / 4;
    const roundedScheduled = Math.round(scheduledHours * 4) / 4;
    
    // Use tighter tolerance for comparison (0.01 hours = 36 seconds)
    return Math.abs(roundedTotal - roundedScheduled) <= 0.01;
  }, [totalEnteredHours, scheduledHours, hasEntries, actionStates.leave, actionStates.sick]);

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <WorkHoursContent
          startTime={startTime}
          endTime={endTime}
          effectiveTotalHours={effectiveTotalHours}
          calculatedTimeHours={calculatedTimeHours}
          hasEntries={hasEntries}
          interactive={interactive}
          isActuallyComplete={isActuallyComplete}
          hoursVariance={hoursVariance}
          isUndertime={isUndertime}
          breakConfig={breakConfigState}
          displayBreakConfig={displayBreakConfig}
          actionStates={actionStates}
          isOverScheduled={isOverScheduled}
          isCalculating={isCalculating}
          date={date}
          handleTimeChange={handleTimeChange}
          handleToggleAction={handleToggleAction}
        />
      </div>
    </div>
  );
};

export default React.memo(WorkHoursInterface);
