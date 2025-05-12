
import React, { useState, useCallback, useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { useTimeCalculations } from '@/hooks/timesheet/useTimeCalculations';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { useTimeEntryState } from '@/hooks/timesheet/detail/hooks/useTimeEntryState';
import { useWorkHoursActions } from '@/components/timesheet/detail/hooks/useWorkHoursActions';
import { useWorkHoursCalculation } from '@/components/timesheet/detail/hooks/useWorkHoursCalculation';
import { WorkHoursContent } from '../work-hours-section';

const logger = createTimeLogger('WorkHoursInterface');

export interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onHoursChange?: (hours: number) => void;
}

/**
 * Work Hours Interface Component
 * Allows viewing and editing work hours for a specific date
 */
const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  entries,
  workSchedule,
  interactive = true,
  onHoursChange
}) => {
  const { getWorkHoursForDate, saveWorkHoursForDate, resetWorkHours, hasCustomHours } = useWorkHours();
  const { calculateHours } = useTimeCalculations();
  const { toast } = useToast();
  
  // Get the work hours state using the specialized hook
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

  // Use specialized hook for break configuration and day hours
  const { 
    calculateDayHours, 
    breakConfig,
    hasLunchBreakInSchedule,
    hasSmokoBreakInSchedule
  } = useWorkHoursCalculation(date, workSchedule);

  // Calculate scheduled hours for the day
  const scheduledHours = calculateDayHours();
  
  // Calculate hours with the workHoursCalculation hook
  const [calculatedTimeHours, setCalculatedTimeHours] = useState(scheduledHours);
  const [isComplete, setIsComplete] = useState(false);
  const [isOverScheduled, setIsOverScheduled] = useState(false);
  
  // Recalculate derived values when inputs change
  useEffect(() => {
    const effectiveHours = totalEnteredHours || 0;
    const isCompleted = effectiveHours >= (scheduledHours * 0.99); // Allow slight rounding differences
    const isOver = effectiveHours > (scheduledHours * 1.05); // Over by 5%
    
    setCalculatedTimeHours(scheduledHours);
    setIsComplete(isCompleted);
    setIsOverScheduled(isOver);
  }, [totalEnteredHours, scheduledHours]);

  // Work hours actions (leave, sick, toil, breaks)
  const {
    actionStates,
    handleToggleAction
  } = useWorkHoursActions(date, userId);

  // Display configuration for breaks
  const [displayBreakConfig, setDisplayBreakConfig] = useState({
    lunch: false,
    smoko: false
  });

  // Update display configuration when action states change
  useEffect(() => {
    setDisplayBreakConfig({
      lunch: breakConfig.lunch && !actionStates.lunch,
      smoko: breakConfig.smoko && !actionStates.smoko
    });
  }, [actionStates, breakConfig]);

  // Call onHoursChange if provided
  React.useEffect(() => {
    if (onHoursChange) {
      onHoursChange(calculatedTimeHours);
    }
  }, [calculatedTimeHours, onHoursChange]);
  
  // Handle reset button click
  const handleReset = () => {
    resetWorkHours(date, userId);
    toast({
      title: "Work Hours Reset",
      description: "Work hours have been reset to default."
    });
  };

  // Check if hours are custom (not from schedule)
  const isCustom = hasCustomHours(date, userId);

  return (
    <div className="space-y-4">
      <WorkHoursContent
        date={date}
        startTime={startTime}
        endTime={endTime}
        effectiveTotalHours={totalEnteredHours}
        calculatedTimeHours={calculatedTimeHours}
        hasEntries={hasEntries}
        interactive={interactive}
        isActuallyComplete={isComplete}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
        breakConfig={breakConfig}
        displayBreakConfig={displayBreakConfig}
        actionStates={actionStates}
        isOverScheduled={isOverScheduled}
        isCalculating={false}
        handleTimeChange={handleTimeChange}
        handleToggleAction={handleToggleAction}
      />
    </div>
  );
};

export default WorkHoursInterface;
