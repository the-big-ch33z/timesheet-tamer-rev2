
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
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-medium mb-2">Work Hours</h3>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total Hours</span>
        <span className="font-medium">{formatHours(totalHours)}</span>
      </div>
    </div>
  );
};

export default WorkHoursSection;
