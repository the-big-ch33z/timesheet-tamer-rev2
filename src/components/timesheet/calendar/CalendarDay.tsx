
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

// Color constants
const COMPLETION_BG = "#F2FCE2";
const INCOMPLETE_BG = "#FEF7CD";
const ANNUAL_LEAVE_BG = "#D3E4FD";  // Soft blue
const SICK_LEAVE_BG = "#fff6f6";    // Light red background
const TOIL_BG = "#f3f0ff";          // Light purple background
const RDO_BG = "bg-blue-100";
const RDO_BORDER = "border-blue-200";
const RDO_TEXT = "text-blue-800";
const SHIFTED_RDO_BG = "bg-blue-200";
const SHIFTED_RDO_BORDER = "border-blue-300 border-dashed";
const SHIFTED_RDO_TEXT = "text-blue-900";

interface CalendarDayProps {
  day: Date;
  entries?: TimeEntry[];  // Made optional to fix the TypeScript error
  isSelected?: boolean;   // Made optional to fix the TypeScript error
  isToday?: boolean;
  onClick: (day: Date) => void;
  isComplete?: boolean;
  totalHours?: number;
  isWeekend?: boolean;
  isRDO?: boolean;
  isShiftedRDO?: boolean;
  originalRdoDate?: Date;
  isWorkDay?: boolean;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  shiftReason?: string | null;
  isLeaveDay?: boolean;
  isSickDay?: boolean;
  isToilDay?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries = [], // Provide default empty array
  isSelected = false, // Default value added
  isToday = false, // Default value added
  onClick,
  isComplete = false,
  totalHours = 0,
  isWeekend = false,
  isRDO = false,
  isShiftedRDO = false,
  originalRdoDate,
  isWorkDay = true,
  expectedStartTime,
  expectedEndTime,
  shiftReason = null,
  isLeaveDay = false,
  isSickDay = false,
  isToilDay = false
}) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const hasEntries = safeEntries.length > 0;

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
    // Important fix: If the day is marked as complete from parent, use that directly
    if (isComplete && hasEntries) {
      return {
        status: "match" as const,
        completion: { isComplete: true },
      };
    }
    
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
  }, [safeEntries, expectedStartTime, expectedEndTime, hasEntries, isComplete]);

  // Determine background color based on entry types
  const backgroundColor = useMemo(() => {
    if (isLeaveDay) return ANNUAL_LEAVE_BG;
    if (isSickDay) return SICK_LEAVE_BG;
    if (isToilDay) return TOIL_BG;
    if (completionStatus.status === "match") return COMPLETION_BG;
    if (completionStatus.status === "nomatch") return INCOMPLETE_BG;
    return undefined;
  }, [isLeaveDay, isSickDay, isToilDay, completionStatus.status]);

  // Memoize className construction to prevent recalculation
  const dayClassName = useMemo(() => {
    return cn(
      "w-full min-h-[80px] p-2 border rounded text-left relative",
      isSelected && "ring-2 ring-blue-500",
      isToday && "bg-blue-50",
      isWeekend && !holidayInfo.isHoliday && !isRDO && "bg-gray-50",
      holidayInfo.isHoliday && "bg-amber-50",
      isRDO && !isShiftedRDO && RDO_BG + " " + RDO_BORDER,
      isShiftedRDO && SHIFTED_RDO_BG + " " + SHIFTED_RDO_BORDER,
      hasEntries && !completionStatus.status.includes("match") && "border-yellow-200",
      hasEntries && completionStatus.status === "match" && "border-green-200",
      !isWorkDay && "cursor-default",
      isLeaveDay && "border-blue-200",
      isSickDay && "border-red-200",
      isToilDay && "border-purple-200"
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
    isWorkDay,
    isLeaveDay,
    isSickDay,
    isToilDay
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
              backgroundColor
            }}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium", isWeekend && "text-gray-500")}>
                {format(safeDate, "d")}
              </span>
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
                <span className="absolute top-1.5 right-2">
                  <Check size={17} color="#22c55e" strokeWidth={2.4} />
                </span>
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

            {isRDO && (
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1 text-xs",
                  isShiftedRDO
                    ? SHIFTED_RDO_BG + " " + SHIFTED_RDO_TEXT + " border " + SHIFTED_RDO_BORDER
                    : RDO_BG + " " + RDO_TEXT + " border " + RDO_BORDER
                )}
              >
                {isShiftedRDO ? "Shifted RDO" : "RDO"}
              </Badge>
            )}

            {isLeaveDay && (
              <Badge variant="secondary" className="mt-1 text-xs bg-blue-100 text-blue-800">
                Annual Leave
              </Badge>
            )}
            {isSickDay && (
              <Badge variant="secondary" className="mt-1 text-xs bg-red-100 text-red-800">
                Sick Leave
              </Badge>
            )}
            {isToilDay && (
              <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-800">
                TOIL
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
            <div className="flex flex-col gap-1 mt-2 text-blue-800 text-sm">
              <span>
                {isShiftedRDO
                  ? "This is a shifted RDO (Rostered Day Off) moved from its original date."
                  : "This is an RDO (Rostered Day Off) according to your work schedule."}
              </span>
              
              {isShiftedRDO && shiftReason && (
                <span className="mt-1 text-blue-600 text-xs italic">{shiftReason}</span>
              )}
              
              {isShiftedRDO && originalRdoDate && (
                <span className="text-blue-600 text-xs">
                  Original date: {format(originalRdoDate, "MMMM d, yyyy")}
                </span>
              )}
            </div>
          )}
          
          {(isLeaveDay || isSickDay || isToilDay) && (
            <div className="flex flex-col gap-1 mt-2">
              {isLeaveDay && <span className="text-blue-800">Annual Leave Day</span>}
              {isSickDay && <span className="text-red-800">Sick Leave Day</span>}
              {isToilDay && <span className="text-purple-800">TOIL Day</span>}
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
      prevProps.isShiftedRDO !== nextProps.isShiftedRDO ||
      prevProps.isWorkDay !== nextProps.isWorkDay ||
      prevProps.expectedStartTime !== nextProps.expectedStartTime ||
      prevProps.expectedEndTime !== nextProps.expectedEndTime ||
      prevProps.shiftReason !== nextProps.shiftReason ||
      prevProps.isLeaveDay !== nextProps.isLeaveDay ||
      prevProps.isSickDay !== nextProps.isSickDay ||
      prevProps.isToilDay !== nextProps.isToilDay) {
    return false;
  }
  
  // Compare dates
  if (prevProps.day?.getTime() !== nextProps.day?.getTime()) {
    return false;
  }
  
  // Compare original RDO dates
  if (
    (prevProps.originalRdoDate && !nextProps.originalRdoDate) ||
    (!prevProps.originalRdoDate && nextProps.originalRdoDate) ||
    (prevProps.originalRdoDate && nextProps.originalRdoDate && 
     prevProps.originalRdoDate.getTime() !== nextProps.originalRdoDate.getTime())
  ) {
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
