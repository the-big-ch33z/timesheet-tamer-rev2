
import React, { useEffect, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import WorkHoursActionButtons from "./components/WorkHoursActionButtons";
import { useWorkHoursActions } from "./hooks/useWorkHoursActions";
import { useTimeEntryState } from "@/hooks/timesheet/detail/hooks/useTimeEntryState";
import { useTOILCalculations } from "@/hooks/timesheet/useTOILCalculations";
import { useWorkHoursCalculation } from "./hooks/useWorkHoursCalculation";
import { WorkHoursStatus } from "./components/WorkHoursStatus";
import { createTimeLogger } from "@/utils/time/errors";

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

  // Calculate effective total hours with break adjustments
  const calculateAdjustedHours = () => {
    // Start with a base adjustment of 0
    let adjustment = 0;
    
    // Only subtract breaks if there's actually a start and end time entered
    if (startTime && endTime) {
      // Apply lunch break adjustment if toggled and part of schedule
      if (actionStates.lunch && hasLunchBreakInSchedule) {
        adjustment -= 0.5; // Subtract 30 minutes for lunch
      }
      
      // Apply smoko break adjustment if toggled and part of schedule
      if (actionStates.smoko && hasSmokoBreakInSchedule) {
        adjustment -= 0.25; // Subtract 15 minutes for smoko
      }
    }
    
    return adjustment;
  };

  const roundToQuarter = (val: number) => Math.round(val * 4) / 4;

  const scheduledHours = useMemo(() => {
    const result = calculateDayHours();
    return roundToQuarter(result);
  }, [calculateDayHours]);

  const leaveActive = actionStates.leave || actionStates.sick;
  const toilActive = actionStates.toil;
  
  // Calculate the raw hours from start/end times plus adjustments for breaks
  const calculatedTimeHours = useMemo(() => {
    try {
      if (!startTime || !endTime) return 0;
      
      // Import the calculation function directly to ensure we're using the latest logic
      const { calculateHoursFromTimes } = require("@/utils/time/calculations/hoursCalculations");
      
      // Get raw hours from timestamps
      const rawHours = calculateHoursFromTimes(startTime, endTime);
      
      // Apply break adjustments
      const breakAdjustment = calculateAdjustedHours();
      
      // Calculate final hours with breaks
      return Math.max(0, roundToQuarter(rawHours + breakAdjustment));
    } catch (error) {
      console.error("Error calculating time hours:", error);
      return 0;
    }
  }, [startTime, endTime, calculateAdjustedHours]);

  // Combine time-based hours with manual entries for effective total
  const effectiveTotalHours = useMemo(() => {
    if (actionStates.leave || actionStates.sick) {
      return scheduledHours;
    }
    
    // If we have entered entries, use their sum, otherwise use calculated hours from time
    return hasEntries ? roundToQuarter(totalEnteredHours) : calculatedTimeHours;
  }, [actionStates.leave, actionStates.sick, scheduledHours, totalEnteredHours, calculatedTimeHours, hasEntries]);

  const isActuallyComplete = useMemo(() => {
    if (leaveActive) return true;
    if (!hasEntries && (!startTime || !endTime)) return false;
    
    const targetHours = scheduledHours;
    const actualHours = hasEntries ? totalEnteredHours : calculatedTimeHours;
    const variance = Math.abs(roundToQuarter(actualHours) - targetHours);
    
    return variance <= 0.01;
  }, [leaveActive, calculatedTimeHours, scheduledHours, hasEntries, startTime, endTime, totalEnteredHours]);

  useEffect(() => {
    if (!hasEntries && !leaveActive && !toilActive) return;
    if (!isActuallyComplete) return;
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isActuallyComplete, calculateToilForDay, entries.length, leaveActive, toilActive]);

  const isOverScheduled = effectiveTotalHours > scheduledHours + 0.01;
  const highlightBg = actionStates.sick
    ? "bg-[#fff6f6]"
    : actionStates.leave
      ? "bg-[#f5faff]"
      : actionStates.toil
        ? "bg-purple-50"
        : "bg-white";

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <WorkHoursHeader hasEntries={hasEntries || leaveActive} />
          <WorkHoursActionButtons 
            value={actionStates} 
            onToggle={(type) => handleToggleAction(type, scheduledHours)} 
          />
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
                onTimeChange={handleTimeChange}
                isComplete={isActuallyComplete}
                hoursVariance={hoursVariance}
                isUndertime={isUndertime}
                breaksIncluded={breakConfig}
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
          <WorkHoursStatus
            effectiveTotalHours={effectiveTotalHours}
            scheduledHours={scheduledHours}
            isOverScheduled={isOverScheduled}
            isActuallyComplete={isActuallyComplete}
            isUndertime={isUndertime}
            isDaySick={actionStates.sick}
            isDayLeave={actionStates.leave}
            isDayToil={actionStates.toil}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkHoursInterface);
