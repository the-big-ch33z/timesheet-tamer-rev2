
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Check } from "lucide-react";
import { getHolidayForDate, defaultQueenslandHolidays } from "@/lib/holidays";
import { toDate } from "@/utils/date/dateConversions";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";

// Add soft green/yellow per provided color codes
const COMPLETION_BG = "#F2FCE2";
const INCOMPLETE_BG = "#FEF7CD";

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
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
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
  isWorkDay = true,
  expectedStartTime,
  expectedEndTime
}) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const hasEntries = safeEntries.length > 0;
  const isShiftedRDO = isRDO && originalRdoDate instanceof Date && !isNaN(originalRdoDate.getTime()) && originalRdoDate.toDateString() !== day.toDateString();

  // Safely convert the day to a Date object
  const safeDate = toDate(day);

  // Get holiday information if we have a valid date
  const holiday = safeDate ? getHolidayForDate(safeDate, defaultQueenslandHolidays) : undefined;
  const isHoliday = !!holiday;

  // Calculate timesheet completion status for this day
  const completion = calculateCompletion(safeEntries, expectedStartTime, expectedEndTime);
  const status: "none" | "match" | "nomatch" =
    hasEntries && expectedStartTime && expectedEndTime
      ? completion.isComplete
        ? "match"
        : "nomatch"
      : "none";

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
              isWeekend && !isHoliday && "bg-gray-50",
              isHoliday && "bg-amber-50",
              isRDO && "bg-blue-50 border-blue-200",
              hasEntries && status === "nomatch" && "!bg-[#FEF7CD] !border-yellow-300",
              hasEntries && status === "match" && "!bg-[#F2FCE2] !border-green-300",
              hasEntries && !isComplete && "border-yellow-200",
              hasEntries && isComplete && "border-green-200",
              !isWorkDay && "cursor-default",
              isShiftedRDO && "border-blue-300 border-dashed"
            )}
            style={{
              // Override background with custom color if needed
              backgroundColor:
                status === "match"
                  ? COMPLETION_BG
                  : status === "nomatch"
                  ? INCOMPLETE_BG
                  : undefined
            }}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium", isWeekend && "text-gray-500")}>{format(safeDate, 'd')}</span>
              {/* ICON overlays */}
              {status === "match" && (
                <span className="absolute top-1.5 right-2">
                  <Check size={17} color="#22c55e" strokeWidth={2.4} />
                </span>
              )}
              {status === "nomatch" && (
                <span className="absolute top-1.5 right-2">
                  <AlertTriangle size={17} color="#eab308" strokeWidth={2.4} />
                </span>
              )}
              {!status || status === "none" ? (
                isComplete && hasEntries
                  ? <Check size={17} color="#22c55e" strokeWidth={2.4} className="opacity-50" />
                  : null
              ) : null}
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
          {status === "nomatch" && (
            <div className="flex items-center gap-1 mt-1 text-yellow-900">
              <AlertTriangle size={16} className="text-yellow-500" />{" "}
              <span>Logged hours are less/more than expected</span>
            </div>
          )}
          {status === "match" && (
            <div className="flex items-center gap-1 mt-1 text-green-800">
              <Check size={16} className="text-green-500" />{" "}
              <span>Hours match expected</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDay;

