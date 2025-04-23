
import React, { memo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeEntry } from "@/types";

interface CalendarDayProps {
  day: Date;
  entries: TimeEntry[];
  isSelected: boolean;
  isToday: boolean;
  onClick: (day: Date) => void;
  isWorkDay?: boolean;
  totalHours: number;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries,
  isSelected,
  isToday,
  onClick,
  isWorkDay = true,
  totalHours
}) => {
  // Check for leave types without relying on entryType which doesn't exist
  // Instead, we'll look at description and job numbers to determine leave types
  const annualLeaveEntry = entries.find(entry => 
    entry.description?.toLowerCase().includes("annual leave") || 
    (entry.jobNumber === "LEAVE" && entry.description?.toLowerCase().includes("annual"))
  );
  
  const sickLeaveEntry = entries.find(entry => 
    entry.description?.toLowerCase().includes("sick leave") || 
    (entry.jobNumber === "SICK" || entry.description?.toLowerCase().includes("sick"))
  );
  
  const leaveType = annualLeaveEntry ? "annual" : 
                    sickLeaveEntry ? "sick" : null;

  const dayBg = leaveType === "annual" ? "bg-blue-50" : 
                leaveType === "sick" ? "bg-red-50" : 
                "bg-transparent";

  return (
    <button
      onClick={() => onClick(day)}
      className={cn(
        "flex flex-col items-start justify-start w-full h-24 p-2 border rounded-lg transition-colors",
        isSelected && "ring-2 ring-blue-500",
        isToday && "bg-blue-50 font-semibold",
        !isWorkDay && "bg-gray-50",
        entries.length > 0 && !leaveType && "bg-green-50",
        dayBg
      )}
      disabled={!isWorkDay}
    >
      <div className="flex justify-between items-start w-full">
        <span className="text-sm font-medium">
          {format(day, "d")}
        </span>
        {totalHours > 0 && (
          <span className="text-xs text-gray-500">
            {totalHours}h
          </span>
        )}
      </div>
      
      {leaveType && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full mt-1",
          leaveType === "annual" ? "bg-blue-100 text-blue-800" : 
          leaveType === "sick" ? "bg-red-100 text-red-800" : ""
        )}>
          {leaveType === "annual" ? "Annual Leave" : "Sick Leave"}
        </span>
      )}
    </button>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default memo(CalendarDay);
