
import React from "react";
import { TimeEntry } from "@/types";
import { formatHours } from "../utils/scheduleUtils";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ entries }) => {
  // Only show this section if there are entries
  if (entries.length === 0) {
    return null;
  }
  
  // Calculate total hours
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Calculate scheduled hours (if we had that information)
  const scheduledHours = 8.0; // This could come from the workSchedule in the future
  
  // Calculate the difference
  const hoursDifference = totalHours - scheduledHours;
  const isUnderHours = hoursDifference < 0;
  
  return (
    <div className="border rounded-lg p-4 bg-white mb-4">
      <h3 className="font-medium mb-2">Work Hours</h3>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total Hours</span>
        <span className="font-medium">{formatHours(totalHours)}</span>
      </div>
      
      {/* Show warning if hours don't match */}
      {Math.abs(hoursDifference) > 0.1 && (
        <div className={`mt-2 text-sm ${isUnderHours ? 'text-amber-600' : 'text-green-600'} flex items-center`}>
          <span className="mr-2">
            {isUnderHours ? (
              <>Hours don't match daily entries (under by {formatHours(Math.abs(hoursDifference))} hrs)</>
            ) : (
              <>Hours exceed daily target (over by {formatHours(hoursDifference)} hrs)</>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default WorkHoursSection;
