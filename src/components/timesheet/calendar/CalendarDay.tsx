import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2 } from "lucide-react";

interface DayStatus {
  isWeekend: boolean;
  dayHoliday: boolean;
  holidayName: string | null;
  isRDO: boolean;
  workHours: {
    startTime: string;
    endTime: string;
  } | null;
  isWorkDay: boolean;
  shiftReason: string | null;
  originalRdoDate?: Date;
}

interface CalendarDayProps {
  day: Date;
  entries: TimeEntry[];
  isSelected: boolean;
  isToday: boolean;
  status: DayStatus;
  onClick: (day: Date) => void;
  isComplete?: boolean;
  totalHours?: number;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries = [],
  isSelected,
  isToday,
  status,
  onClick,
  isComplete = false,
  totalHours = 0
}) => {
  const hasEntries = entries.length > 0;
  const isShiftedRDO = status.isRDO && status.originalRdoDate &&
    status.originalRdoDate.toDateString() !== day.toDateString();

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
              status.isWeekend && "bg-gray-50",
              status.dayHoliday && "bg-amber-50",
              status.isRDO && "bg-blue-50 border-blue-200",
              hasEntries && isComplete && "bg-green-50 border-green-200",
              hasEntries && !isComplete && "bg-yellow-50 border-yellow-200",
              !status.isWorkDay && "cursor-default",
              isShiftedRDO && "border-blue-300 border-dashed"
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium", status.isWeekend && "text-gray-500")}>{format(day, 'd')}</span>
              {isComplete && hasEntries && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>

            {status.dayHoliday && (
              <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
                {status.holidayName}
              </Badge>
            )}

            {status.isRDO && (
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
          <p>{totalHours} hrs logged</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDay;
