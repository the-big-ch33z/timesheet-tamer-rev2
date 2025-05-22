
import React from 'react';
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkHoursDisplayProps {
  calculatedHours: number;
  totalHours: number;
  isComplete: boolean;
  isUndertime: boolean;
  hoursVariance: number;
  isOverScheduled: boolean;
  hasEntries: boolean;
  isCalculating: boolean;
  lunchBreak?: boolean;
  smokoBreak?: boolean;
  hasLeaveEntry?: boolean;
}

const WorkHoursDisplay: React.FC<WorkHoursDisplayProps> = ({
  calculatedHours,
  totalHours,
  isComplete,
  isUndertime,
  hoursVariance,
  isOverScheduled,
  hasEntries,
  isCalculating,
  lunchBreak = false,
  smokoBreak = false,
  hasLeaveEntry = false
}) => {
  // Format hours for display with one decimal place
  const formatHours = (hours: number): string => {
    return hours.toFixed(1);
  };
  
  // Determine the variance display text
  const getVarianceText = () => {
    if (Math.abs(hoursVariance) < 0.1) return "on target";
    if (hoursVariance > 0) return `+${formatHours(hoursVariance)} hours`;
    return `${formatHours(hoursVariance)} hours`;
  };
  
  // Get the appropriate icon based on completion status
  const StatusIcon = isComplete ? CheckCircle : isUndertime ? AlertCircle : Clock;
  
  // For leave days, we want to show the scheduled hours both as calculated and total
  const displayCalculatedHours = calculatedHours;
  const displayTotalHours = hasLeaveEntry ? calculatedHours : totalHours;
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Scheduled hours:</span>
          <span className="font-medium">{formatHours(displayCalculatedHours)} hours</span>
        </div>
        
        {hasEntries && !hasLeaveEntry && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              {lunchBreak && "Worked through lunch (+0.5h)"}
              {smokoBreak && (lunchBreak ? ", smoko (+0.25h)" : "Worked through smoko (+0.25h)")}
            </span>
            <span className="font-medium text-blue-600">
              {(lunchBreak || smokoBreak) && "+"}
              {lunchBreak && "0.5"}
              {lunchBreak && smokoBreak && " + 0.25"}
              {!lunchBreak && smokoBreak && "0.25"}
              {(lunchBreak || smokoBreak) && " hours"}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center font-medium">
          <span className={cn(
            "flex items-center gap-1.5",
            hasLeaveEntry ? "text-sky-600" : 
            isComplete ? "text-green-600" : 
            isUndertime ? "text-amber-500" : 
            "text-gray-600"
          )}>
            {hasLeaveEntry ? (
              <>
                <Calendar size={16} />
                <span>Annual Leave hours:</span>
              </>
            ) : (
              <>
                <StatusIcon size={16} />
                <span>Total hours:</span>
              </>
            )}
          </span>
          <span className={cn(
            hasLeaveEntry ? "text-sky-600" : 
            isComplete ? "text-green-600" : 
            isUndertime ? "text-amber-500" : 
            "text-gray-600"
          )}>
            {formatHours(displayTotalHours)} hours
          </span>
        </div>
        
        {!hasLeaveEntry && Math.abs(hoursVariance) > 0.01 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Variance:</span>
            <span className={cn(
              "font-medium",
              hoursVariance > 0 ? "text-green-600" : hoursVariance < 0 ? "text-amber-500" : "text-gray-600"
            )}>
              {getVarianceText()}
            </span>
          </div>
        )}
        
        {isOverScheduled && !hasLeaveEntry && (
          <div className="text-xs text-amber-500 mt-1">
            Hours exceed scheduled time by more than 5%
          </div>
        )}
        
        {isCalculating && (
          <div className="text-xs text-blue-500 mt-1 animate-pulse">
            Calculating hours...
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkHoursDisplay;
