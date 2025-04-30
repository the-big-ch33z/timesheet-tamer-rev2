
import React, { useMemo } from "react";
import { createTimeLogger } from "@/utils/time/errors";
import { useWorkHoursActions } from "../hooks/useWorkHoursActions";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { useWorkHoursCalculation } from "../hooks/useWorkHoursCalculation";
import { WorkHoursInterfaceProps } from "./types";
import WorkHoursContent from "./WorkHoursContent";
import { useHoursCalculation } from "./useHoursCalculation";
import { useBreakAdjustments } from "./useBreakAdjustments";
import { useToilEffects } from "./useToilEffects";

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
    
    // If we have entered entries, use their sum, otherwise show 0
    // This is the key fix - we now return 0 instead of calculatedTimeHours when there are no entries
    return hasEntries ? Math.round(totalEnteredHours * 4) / 4 : 0;
  }, [actionStates.leave, actionStates.sick, scheduledHours, totalEnteredHours, hasEntries]);

  // Set up TOIL calculation effects
  useToilEffects(
    hasEntries,
    leaveActive,
    toilActive,
    isComplete,
    calculateToilForDay,
    entries.length
  );

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
          isActuallyComplete={isComplete && hasEntries} // Only consider complete if there are entries
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
