
import React, { useState, useCallback, useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { WorkHoursContent } from '../work-hours-section';
import DailySummaryPanel from '../components/DailySummaryPanel';

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
  const { toast } = useToast();
  
  // Use our unified hook with all options
  const {
    startTime,
    endTime,
    calculatedHours,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    actionStates,
    handleTimeChange,
    handleToggleAction,
    resetWorkHours
  } = useWorkHours({
    userId,
    date,
    entries,
    workSchedule,
    interactive,
    onHoursChange
  });

  // Calculate derived states
  const [isComplete, setIsComplete] = useState(false);
  const [isOverScheduled, setIsOverScheduled] = useState(false);
  const scheduledHours = calculatedHours;
  
  // Break configuration
  const breakConfig = {
    lunch: workSchedule?.weeks?.[1]?.monday?.breaks?.lunch || false,
    smoko: workSchedule?.weeks?.[1]?.monday?.breaks?.smoko || false
  };
  
  // Display configuration for breaks
  const displayBreakConfig = {
    lunch: breakConfig.lunch && !actionStates.lunch,
    smoko: breakConfig.smoko && !actionStates.smoko
  };

  // Recalculate derived values when inputs change
  useEffect(() => {
    const effectiveHours = totalEnteredHours || 0;
    const isCompleted = effectiveHours >= (scheduledHours * 0.99); // Allow slight rounding differences
    const isOver = effectiveHours > (scheduledHours * 1.05); // Over by 5%
    
    setIsComplete(isCompleted);
    setIsOverScheduled(isOver);
  }, [totalEnteredHours, scheduledHours]);

  // Handle reset button click
  const handleReset = useCallback(() => {
    resetWorkHours(date, userId);
    toast({
      title: "Work Hours Reset",
      description: "Work hours have been reset to default."
    });
  }, [resetWorkHours, date, userId, toast]);

  // Create a wrapper for handleToggleAction that adapts the signature
  const handleToggleActionWrapper = useCallback((action: string) => {
    // Pass the scheduledHours as the second parameter
    handleToggleAction(action, scheduledHours);
  }, [handleToggleAction, scheduledHours]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <WorkHoursContent
          date={date}
          startTime={startTime}
          endTime={endTime}
          effectiveTotalHours={totalEnteredHours}
          calculatedTimeHours={calculatedHours}
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
          handleToggleAction={handleToggleActionWrapper}
        />
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <DailySummaryPanel
          requiredHours={calculatedHours}
          submittedHours={totalEnteredHours}
          date={date}
        />
      </div>
    </div>
  );
};

export default WorkHoursInterface;
