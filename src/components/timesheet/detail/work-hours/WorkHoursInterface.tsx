
import React, { useState, useCallback, useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { WorkHoursContent } from '../work-hours-section';
import { useLeaveActions } from '@/hooks/timesheet/leave/useLeaveActions';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';

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

  // Use the leave actions hook to check for leave entries
  const { hasLeaveEntries } = useLeaveActions({ userId });
  
  // Calculate derived states
  const [isComplete, setIsComplete] = useState(false);
  const [isOverScheduled, setIsOverScheduled] = useState(false);
  const scheduledHours = calculatedHours;
  
  // Check if this day has leave entries
  const [hasLeave, setHasLeave] = useState(false);
  
  // Update leave state when entries change
  useEffect(() => {
    const checkLeaveStatus = () => {
      const leaveState = hasLeaveEntries(date, userId);
      setHasLeave(leaveState);
      
      // If the UI state doesn't match the entry state, sync them
      if (leaveState !== actionStates.leave) {
        logger.debug(`Syncing leave state UI: ${leaveState} (from entries) vs ${actionStates.leave} (current UI state)`);
        
        // We don't call handleToggleAction directly to avoid infinite loops
        // Instead we publish an event so the handler can update the UI
        timeEventsService.publish(WORK_HOURS_EVENTS.ACTION_TOGGLED, {
          userId,
          date: format(date, 'yyyy-MM-dd'),
          actionType: 'leave',
          isActive: leaveState,
          scheduledHours: calculatedHours,
          timestamp: Date.now(),
          source: 'sync'
        });
      }
    };
    
    checkLeaveStatus();
  }, [entries, date, userId, actionStates.leave, hasLeaveEntries, calculatedHours]);
  
  // Enhanced toggle action handler to include isActive state
  const enhancedToggleAction = useCallback((type: string) => {
    // For leave actions we need to track if it's being turned on or off
    if (type === 'leave') {
      const willBeActive = !actionStates.leave;
      
      // Call the original handler first
      handleToggleAction(type, calculatedHours);
      
      // Then publish additional details about the toggle action
      timeEventsService.publish(WORK_HOURS_EVENTS.ACTION_TOGGLED, {
        userId,
        date: format(date, 'yyyy-MM-dd'),
        actionType: type,
        isActive: willBeActive,
        scheduledHours: calculatedHours,
        timestamp: Date.now()
      });
    } else {
      // For non-leave actions, just use the original handler
      handleToggleAction(type, calculatedHours);
    }
  }, [handleToggleAction, actionStates.leave, userId, date, calculatedHours]);
  
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
  const handleReset = () => {
    resetWorkHours(date, userId);
    toast({
      title: "Work Hours Reset",
      description: "Work hours have been reset to default."
    });
  };

  return (
    <div className="space-y-4">
      <WorkHoursContent
        date={date}
        startTime={startTime}
        endTime={endTime}
        effectiveTotalHours={totalEnteredHours}
        calculatedTimeHours={calculatedHours}
        hasEntries={hasEntries}
        interactive={interactive && !hasLeave} // Disable interaction if on leave
        isActuallyComplete={isComplete || hasLeave} // Mark as complete if on leave
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
        breakConfig={breakConfig}
        displayBreakConfig={displayBreakConfig}
        actionStates={actionStates}
        isOverScheduled={isOverScheduled}
        isCalculating={false}
        handleTimeChange={handleTimeChange}
        handleToggleAction={enhancedToggleAction} // Use enhanced toggle handler
        isLeaveDay={hasLeave} // Pass leave state to WorkHoursContent
      />
    </div>
  );
};

export default WorkHoursInterface;
