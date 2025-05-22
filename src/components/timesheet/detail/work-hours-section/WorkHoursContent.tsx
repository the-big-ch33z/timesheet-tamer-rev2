
import React from 'react';
import { format } from 'date-fns';
import WorkHoursDisplay from './WorkHoursDisplay';
import WorkHoursForm from './WorkHoursForm';
import WorkHoursActionButtons from '../components/WorkHoursActionButtons';
import { cn } from '@/lib/utils';

export interface WorkHoursContentProps {
  date: Date;
  startTime: string;
  endTime: string;
  effectiveTotalHours: number;
  calculatedTimeHours: number;
  hasEntries: boolean;
  interactive: boolean;
  isActuallyComplete: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  breakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  displayBreakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  actionStates: {
    leave: boolean;
    sick: boolean;
    toil: boolean;
    lunch: boolean;
    smoko: boolean;
  };
  isOverScheduled: boolean;
  isCalculating: boolean;
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
  handleToggleAction: (type: string, scheduledHours: number) => void;
  isLeaveDay?: boolean; // New prop to indicate leave day
}

const WorkHoursContent: React.FC<WorkHoursContentProps> = ({
  date,
  startTime,
  endTime,
  effectiveTotalHours,
  calculatedTimeHours,
  hasEntries,
  interactive,
  isActuallyComplete,
  hoursVariance,
  isUndertime,
  breakConfig,
  displayBreakConfig,
  actionStates,
  isOverScheduled,
  isCalculating,
  handleTimeChange,
  handleToggleAction,
  isLeaveDay = false // Default to false
}) => {
  // Format date for display
  const formattedDate = format(date, 'EEEE, d MMMM yyyy');
  
  // Determine if the day has special styling based on leave/sick states
  const hasLeaveStyle = actionStates.leave || isLeaveDay;
  const hasSickStyle = actionStates.sick;
  const hasToilStyle = actionStates.toil;
  
  // Special day style classes
  const specialDayClasses = cn(
    hasLeaveStyle && "bg-sky-50 border-sky-200",
    hasSickStyle && "bg-red-50 border-red-200",
    hasToilStyle && "bg-purple-50 border-purple-200"
  );
  
  // Determine status text based on leave/sick/TOIL states
  const statusText = hasLeaveStyle ? "Annual Leave" 
                  : hasSickStyle ? "Sick Leave"
                  : hasToilStyle ? "TOIL"
                  : "";

  return (
    <div className={cn(
      "border rounded-md p-4 transition-colors",
      specialDayClasses || "border-gray-200 bg-white"
    )}>
      <h3 className="text-lg font-medium mb-3">{formattedDate}</h3>
      
      {/* Action buttons */}
      <WorkHoursActionButtons
        value={actionStates}
        onToggle={(type) => handleToggleAction(type, calculatedTimeHours)}
      />
      
      {/* Show status text when on leave/sick/TOIL */}
      {statusText && (
        <div className="text-center font-medium my-2 text-gray-700">
          {statusText}
        </div>
      )}
      
      {/* Time entry form */}
      {(!hasLeaveStyle && !hasSickStyle && !hasToilStyle) && (
        <WorkHoursForm
          startTime={startTime}
          endTime={endTime}
          interactive={interactive}
          onTimeChange={handleTimeChange}
        />
      )}
      
      {/* Hours display */}
      <WorkHoursDisplay
        calculatedHours={calculatedTimeHours}
        totalHours={effectiveTotalHours}
        isComplete={isActuallyComplete}
        isUndertime={isUndertime && !hasLeaveStyle && !hasSickStyle && !hasToilStyle} // Don't show undertime warning for leave days
        hoursVariance={hoursVariance}
        isOverScheduled={isOverScheduled}
        hasEntries={hasEntries}
        isCalculating={isCalculating}
        lunchBreak={displayBreakConfig.lunch}
        smokoBreak={displayBreakConfig.smoko}
        hasLeaveEntry={hasLeaveStyle}  // Pass leave state to display
      />
    </div>
  );
};

export default WorkHoursContent;
