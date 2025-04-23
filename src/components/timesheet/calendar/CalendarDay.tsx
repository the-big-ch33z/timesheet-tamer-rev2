
import React, { useMemo, memo } from "react";
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
  // Fix: mark day as shifted RDO if it has an originalRdoDate different from itself
  const isShiftedRDO = isRDO && originalRdoDate instanceof Date && !isNaN(originalRdoDate.getTime()) && originalRdoDate.toDateString() !== day.toDateString();

  // Safely convert the day to a Date object - memoized
  const safeDate = useMemo(() => toDate(day), [day]);

  // Memoize holiday information calculation
  const holidayInfo = useMemo(() => {
    if (!safeDate) return { isHoliday: false, holiday: undefined };
    const holiday = getHolidayForDate(safeDate, defaultQueenslandHolidays);
    return {
      isHoliday: !!holiday,
      holiday,
    };
  }, [safeDate]);

  // Memoize completion status calculation with tighter tolerance
  const completionStatus = useMemo(() => {
    if (!safeEntries.length || !expectedStartTime || !expectedEndTime) {
      return {
        status: "none" as const,
        completion: { isComplete: false },
      };
    }

    // Use a tighter tolerance (0.01) for matching hours
    const completion = calculateCompletion(safeEntries, expectedStartTime, expectedEndTime, 0.01);
    const status = hasEntries
      ? completion.isComplete
        ? ("match" as const)
        : ("nomatch" as const)
      : ("none" as const);

    return { status, completion };
  }, [safeEntries, expectedStartTime, expectedEndTime, hasEntries]);

  // Memoize className construction to prevent recalculation
  const dayClassName = useMemo(() => {
    return cn(
      "w-full min-h-[80px] p-2 border rounded text-left relative",
      isSelected && "ring-2 ring-blue-500",
      isToday && "bg-blue-50",
      isWeekend && !holidayInfo.isHoliday && !isRDO && "bg-gray-50",
      holidayInfo.isHoliday && "bg-amber-50",
      // RDO Blue backgrounds:
      isRDO && !isShiftedRDO && "bg-blue-100 border-blue-200",
      isShiftedRDO && "bg-blue-200 border-blue-300 border-dashed",
      hasEntries && completionStatus.status === "nomatch" && "!bg-[#FEF7CD] !border-yellow-300",
      hasEntries && completionStatus.status === "match" && "!bg-[#F2FCE2] !border-green-300",
      hasEntries && !isComplete && "border-yellow-200",
      hasEntries && isComplete && "border-green-200",
      !isWorkDay && "cursor-default"
    );
  }, [
    isSelected,
    isToday,
    isWeekend,
    holidayInfo.isHoliday,
    isRDO,
    isShiftedRDO,
    hasEntries,
    completionStatus.status,
    isComplete,
    isWorkDay,
  ]);

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
            className={dayClassName}
            style={{
              // Override background with custom color if needed
              backgroundColor:
                completionStatus.status === "match"
                  ? COMPLETION_BG
                  : completionStatus.status === "nomatch"
                  ? INCOMPLETE_BG
                  : undefined,
            }}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium", isWeekend && "text-gray-500")}>
                {format(safeDate, "d")}
              </span>
              {/* ICON overlays - Make sure completion check is more prominent */}
              {completionStatus.status === "match" && (
                <span className="absolute top-1.5 right-2">
                  <Check size={17} color="#22c55e" strokeWidth={2.4} />
                </span>
              )}
              {completionStatus.status === "nomatch" && (
                <span className="absolute top-1.5 right-2">
                  <AlertTriangle size={17} color="#eab308" strokeWidth={2.4} />
                </span>
              )}
              {completionStatus.status === "none" && isComplete && hasEntries && (
                <Check size={17} color="#22c55e" strokeWidth={2.4} className="opacity-50" />
              )}
            </div>

            {holidayInfo.isHoliday && holidayInfo.holiday && (
              <Badge
                variant="secondary"
                className="mt-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                {holidayInfo.holiday.name}
              </Badge>
            )}

            {/* Restore clear blue RDO display */}
            {isRDO && (
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1 text-xs",
                  isShiftedRDO
                    ? "bg-blue-200 text-blue-900 border-blue-300"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                )}
              >
                {isShiftedRDO ? "Shifted RDO" : "RDO"}
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{!isNaN(totalHours) ? totalHours : 0} hrs logged</p>
          {completionStatus.status === "nomatch" && (
            <div className="flex items-center gap-1 mt-1 text-yellow-900">
              <AlertTriangle size={16} className="text-yellow-500" />{" "}
              <span>Logged hours are less/more than expected</span>
            </div>
          )}
          {completionStatus.status === "match" && (
            <div className="flex items-center gap-1 mt-1 text-green-800">
              <Check size={16} className="text-green-500" />{" "}
              <span>Hours match expected</span>
            </div>
          )}
          {isRDO && (
            <div className="flex items-center gap-1 mt-2 text-blue-800">
              <span>
                {isShiftedRDO
                  ? "This is a shifted RDO (Rostered Day Off) assigned from a different week."
                  : "This is an RDO (Rostered Day Off) according to your work schedule."}
              </span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Use custom equality check for memoization to avoid unnecessary rerenders
function calendarDayPropsAreEqual(prevProps: CalendarDayProps, nextProps: CalendarDayProps) {
  // Check simple equality for basic props
  if (prevProps.isSelected !== nextProps.isSelected ||
      prevProps.isToday !== nextProps.isToday ||
      prevProps.isComplete !== nextProps.isComplete ||
      prevProps.totalHours !== nextProps.totalHours ||
      prevProps.isWeekend !== nextProps.isWeekend ||
      prevProps.isRDO !== nextProps.isRDO ||
      prevProps.isWorkDay !== nextProps.isWorkDay ||
      prevProps.expectedStartTime !== nextProps.expectedStartTime ||
      prevProps.expectedEndTime !== nextProps.expectedEndTime) {
    return false;
  }
  
  // Compare dates
  if (prevProps.day?.getTime() !== nextProps.day?.getTime()) {
    return false;
  }
  
  // Compare original RDO dates
  if (prevProps.originalRdoDate?.getTime() !== nextProps.originalRdoDate?.getTime()) {
    return false;
  }
  
  // Compare entries length
  const prevEntries = prevProps.entries || [];
  const nextEntries = nextProps.entries || [];
  if (prevEntries.length !== nextEntries.length) {
    return false;
  }
  
  // For entries, just check IDs and hours (most important for rendering)
  for (let i = 0; i < prevEntries.length; i++) {
    if (prevEntries[i].id !== nextEntries[i].id || 
        prevEntries[i].hours !== nextEntries[i].hours) {
      return false;
    }
  }
  
  return true;
}

// Export memoized component with custom equality check
export default memo(CalendarDay, calendarDayPropsAreEqual);
