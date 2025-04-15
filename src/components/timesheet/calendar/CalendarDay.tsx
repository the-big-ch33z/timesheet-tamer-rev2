
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeEntry } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2 } from 'lucide-react';

interface DayStatus {
  isWeekend: boolean;
  dayHoliday: boolean;
  holidayName: string | null;
  isRDO: boolean;
  workHours: { startTime: string; endTime: string } | null;
  isWorkDay: boolean;
}

interface CalendarDayProps {
  day: Date;
  entries: TimeEntry[];
  isSelected: boolean;
  isToday: boolean;
  status: DayStatus;
  onDayClick: (day: Date) => void;
  isComplete?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  entries,
  isSelected,
  isToday,
  status,
  onDayClick,
  isComplete
}) => {
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onDayClick(day)}
            className={cn(
              "w-full min-h-[80px] p-2 border rounded text-left relative",
              isSelected && "ring-2 ring-blue-500",
              isToday && "bg-blue-50",
              status.isWeekend && "bg-gray-50",
              status.dayHoliday && "bg-amber-50",
              status.isRDO && "bg-purple-50",
              isComplete && "bg-green-50 border-green-200",
              !status.isWorkDay && "cursor-default"
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "font-medium",
                status.isWeekend && "text-gray-500"
              )}>
                {format(day, 'd')}
              </span>
              
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>

            {status.dayHoliday && (
              <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
                {status.holidayName}
              </Badge>
            )}

            {status.isRDO && (
              <Badge variant="secondary" className="mt-1 text-xs">
                RDO
              </Badge>
            )}

            {entries.length > 0 && (
              <div className="mt-1 text-xs font-medium text-gray-600">
                {totalHours.toFixed(1)} hrs
              </div>
            )}
          </button>
        </TooltipTrigger>
        
        <TooltipContent>
          <div className="text-sm">
            {format(day, 'EEEE, MMMM d, yyyy')}
            {status.workHours && (
              <div className="text-xs text-gray-500">
                {status.workHours.startTime} - {status.workHours.endTime}
              </div>
            )}
            {entries.length > 0 && (
              <div className="text-xs font-medium mt-1">
                Total: {totalHours.toFixed(1)} hours
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDay;
