
import React from "react";
import { AlertTriangle, Check, Info } from "lucide-react";

interface WorkHoursAlertsProps {
  hasEntries: boolean;
  isUndertime: boolean;
  hoursVariance: number;
  interactive: boolean;
  date: Date;
  isComplete: boolean;
  isOverScheduled?: boolean;
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
      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center text-sm">
        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>This day appears to have {Math.abs(hoursVariance).toFixed(2)} hours under your scheduled hours.</span>
      </div>
    );
  }

  // Enhanced completion alert for complete days
  if (isComplete) {
    return (
      <div className="mt-3 p-4 rounded-lg bg-green-50 border border-green-300 text-green-800 flex items-center text-sm shadow-sm">
        <Check className="h-5 w-5 mr-3 flex-shrink-0 text-green-600" />
        <span className="font-medium">This day has been completed with all scheduled hours accounted for.</span>
      </div>
    );
  }

  // Show reminder for today
  if (isToday && !isComplete) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center text-sm">
        <Info className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>Don't forget to enter all your work hours for today.</span>
      </div>
    );
  }

  return null;
};

export default WorkHoursAlerts;
