
import React from "react";
import { format } from "date-fns";
import { TimeEntry, WeekDay, WorkHours } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DayStatusInfo {
  isWeekend: boolean;
  dayHoliday: boolean;
  holidayName: string | null;
  isRDO: boolean;
  workHours: WorkHours | null;
  isWorkDay: boolean;
}

interface CalendarDayProps {
  day: Date;
  entries: TimeEntry[];
  isSelected: boolean;
  isToday: boolean;
  status: DayStatusInfo;
  onDayClick: (day: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries,
  isSelected,
  isToday,
  status,
  onDayClick
}) => {
  const { isWeekend, dayHoliday, holidayName, isRDO, workHours, isWorkDay } = status;
  const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);
  const hasEntries = entries.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`p-3 min-h-[80px] border rounded cursor-pointer transition-all duration-200 ease-in-out
              ${isWeekend ? "bg-gray-200 border-gray-300" : "bg-white border-gray-200"}
              ${dayHoliday ? "bg-[#FEF7CD] border-amber-200" : ""}
              ${!isWorkDay && !dayHoliday ? "bg-gray-100 border-gray-300" : ""}
              ${isRDO ? "bg-blue-50 border-blue-200" : ""}
              ${isToday ? "ring-2 ring-indigo-500" : ""}
              ${isSelected ? "transform scale-[1.02] shadow-md z-10 ring-2 ring-indigo-400" : ""}
              hover:bg-gray-100
            `}
            onClick={() => onDayClick(day)}
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-lg font-medium
                  ${isWeekend ? "text-gray-900" : ""}
                  ${isToday ? "bg-indigo-500 text-white w-7 h-7 flex items-center justify-center rounded-full" : ""}
                  ${isRDO ? "text-blue-700" : ""}
                  ${!isWorkDay && !isRDO && !isWeekend ? "text-gray-500" : ""}
                `}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col items-end">
                {hasEntries && (
                  <span className="text-xs font-medium text-indigo-700 px-1 bg-indigo-50 rounded">
                    {totalHours}h
                  </span>
                )}
              </div>
            </div>

            {/* Entry indicators */}
            {hasEntries && (
              <div className="mt-2">
                {entries.slice(0, 1).map((entry) => (
                  <div
                    key={entry.id}
                    className="text-xs p-1 mb-1 bg-indigo-100 rounded truncate"
                  >
                    {entry.project} ({entry.hours}h)
                  </div>
                ))}
                {entries.length > 1 && (
                  <div className="text-xs text-indigo-600">
                    +{entries.length - 1} more
                  </div>
                )}
              </div>
            )}

            {/* Holiday indicator */}
            {dayHoliday && (
              <div className="text-xs text-amber-700 mt-1 font-medium">
                {holidayName || "Holiday"}
              </div>
            )}
            
            {/* RDO indicator */}
            {isRDO && !dayHoliday && (
              <div className="text-xs text-blue-700 mt-1 font-medium">
                RDO
              </div>
            )}
            
            {/* Non-working day indicator (not weekend, not holiday, not RDO) */}
            {!isWorkDay && !isWeekend && !dayHoliday && !isRDO && (
              <div className="text-xs text-gray-500 mt-1 font-medium">
                Non-working
              </div>
            )}
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="p-2 max-w-[200px]">
          <div>
            <p className="font-semibold mb-1">{format(day, "EEEE, MMMM d, yyyy")}</p>
            
            {dayHoliday && (
              <p className="text-amber-700 text-sm">
                {holidayName || "Holiday"}
              </p>
            )}
            
            {isRDO && !dayHoliday && (
              <p className="text-blue-700 text-sm">Rostered Day Off</p>
            )}
            
            {isWorkDay && workHours && !dayHoliday && (
              <>
                <p className="text-sm">Working Hours:</p>
                <p className="text-sm font-medium">{workHours.startTime} - {workHours.endTime}</p>
              </>
            )}
            
            {!isWorkDay && !dayHoliday && !isRDO && isWeekend && (
              <p className="text-sm text-gray-600">Weekend</p>
            )}
            
            {!isWorkDay && !dayHoliday && !isRDO && !isWeekend && (
              <p className="text-sm text-gray-600">Non-working day</p>
            )}
            
            {hasEntries && (
              <div className="mt-1 pt-1 border-t border-gray-200">
                <p className="text-sm">
                  Total hours: <span className="font-medium">{totalHours}</span>
                </p>
                {entries.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDay;
