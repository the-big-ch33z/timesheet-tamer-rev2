
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2 } from "lucide-react";
import { getHolidayForDate, defaultQueenslandHolidays } from "@/lib/holidays";
import { toDate } from "@/utils/date/dateConversions";

interface CalendarDayProps {
  day: Date;
  entries: TimeEntry[];
  isSelected: boolean;
  isToday: boolean;
  onClick: (day: Date) => void;
  isComplete?: boolean;
  totalHours?: number;
  isWeekend?: boolean;
  isRDO?: boolean;
  originalRdoDate?: Date;
  isWorkDay?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries = [],
  isSelected,
  isToday,
  onClick,
  isComplete = false,
  totalHours = 0,
  isWeekend = false,
  isRDO = false,
  originalRdoDate,
  isWorkDay = true
}) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const hasEntries = safeEntries.length > 0;
  const isShiftedRDO = isRDO && originalRdoDate instanceof Date && !isNaN(originalRdoDate.getTime()) && originalRdoDate.toDateString() !== day.toDateString();
  
  // Safely convert the day to a Date object
  const safeDate = toDate(day);
  
  // Get holiday information if we have a valid date
  const holiday = safeDate ? getHolidayForDate(safeDate, defaultQueenslandHolidays) : undefined;
  const isHoliday = !!holiday;

  // If we don't have a valid date, render a placeholder with an error state
  if (!safeDate) {
    return (
      <div className="w-full min-h-[80px] p-2 border rounded bg-red-50 border-red-300 text-red-700 flex items-center justify-center text-sm">
        Invalid date
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick(day)}
            className={cn(
              "w-full min-h-[80px] p-2 border rounded text-left relative",
              isSelected && "ring-2 ring-blue-500",
              isToday && "bg-blue-50",
              isWeekend && "bg-gray-50",
              isHoliday && "bg-amber-50",
              isRDO && "bg-blue-50 border-blue-200",
              hasEntries && isComplete && "bg-green-50 border-green-200",
              hasEntries && !isComplete && "bg-yellow-50 border-yellow-200",
              !isWorkDay && "cursor-default",
              isShiftedRDO && "border-blue-300 border-dashed"
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium", isWeekend && "text-gray-500")}>{format(safeDate, 'd')}</span>
              {isComplete && hasEntries && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>

            {isHoliday && (
              <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
                {holiday.name}
              </Badge>
            )}

            {isRDO && (
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1 text-xs",
                  isShiftedRDO ? "bg-blue-200 text-blue-900 border-blue-300" : "bg-blue-100 text-blue-800"
                )}
              >
                {isShiftedRDO ? "Shifted RDO" : "RDO"}
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{!isNaN(totalHours) ? totalHours : 0} hrs logged</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDay;
