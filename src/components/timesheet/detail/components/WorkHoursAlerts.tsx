
import React from "react";
import { AlertTriangle, Check, Info } from "lucide-react";

interface WorkHoursAlertsProps {
  hasEntries: boolean;
  isUndertime: boolean;
  hoursVariance: number;
  interactive: boolean;
  date: Date;
  isComplete: boolean;
  isOverScheduled?: boolean;  // Added missing prop
  effectiveHours: number;
  scheduledHours: number;
  breakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  displayBreakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  actionStates: {
    lunch: boolean;
    smoko: boolean;
  };
  onToggleAction: (action: string) => void;
}

const WorkHoursAlerts: React.FC<WorkHoursAlertsProps> = ({
  hasEntries,
  isUndertime,
  hoursVariance,
  interactive,
  date,
  isComplete,
  isOverScheduled,
  effectiveHours,
  scheduledHours,
  breakConfig,
  displayBreakConfig,
  actionStates,
  onToggleAction
}) => {
  // Only show alerts on interactive displays and when there are entries
  if (!interactive || !hasEntries) return null;

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  // Show undertime alert for past days
  if (isUndertime && isPast && !isComplete) {
    return (
      <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-100 text-amber-700 flex items-center text-xs">
        <AlertTriangle className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
        <span>This day appears to have {Math.abs(hoursVariance).toFixed(2)} hours under your scheduled hours.</span>
      </div>
    );
  }

  // Show completion alert for complete days
  if (isComplete) {
    return (
      <div className="mt-2 p-2 rounded-md bg-green-50 border border-green-100 text-green-700 flex items-center text-xs">
        <Check className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
        <span>This day has been completed with all scheduled hours accounted for.</span>
      </div>
    );
  }

  // Show reminder for today
  if (isToday && !isComplete) {
    return (
      <div className="mt-2 p-2 rounded-md bg-blue-50 border border-blue-100 text-blue-700 flex items-center text-xs">
        <Info className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
        <span>Don't forget to enter all your work hours for today.</span>
      </div>
    );
  }

  return null;
};

export default WorkHoursAlerts;
