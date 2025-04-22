
import React from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday as dateFnsIsToday 
} from "date-fns";
import CalendarDay from "./CalendarDay";
import { TimeEntry, WorkSchedule } from "@/types";
import { useCalendarHelpers } from "./useCalendarHelpers";
import { isHoliday } from "@/utils/time/services/toil/holiday-utils";
import { defaultQueenslandHolidays } from "@/lib/holidays";
import { useLogger } from "@/hooks/useLogger";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  onDayClick: (day: Date) => void;
  userId: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  workSchedule,
  onDayClick,
  userId
}) => {
  const logger = useLogger("CalendarGrid");
  const { getDayState } = useCalendarHelpers(workSchedule);
  
  // Generate all days that should appear in the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days by week for display
  const weeks: Date[][] = [];
  let week: Date[] = [];

  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });

  // Render the calendar grid
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        // Get state for this day
        const dayState = getDayState(day, selectedDate, monthStart);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        
        // Check if it's a holiday
        const isPublicHoliday = isHoliday(day, defaultQueenslandHolidays);

        if (!isCurrentMonth) {
          // Render days from other months as disabled
          return (
            <div
              key={`empty-${i}`}
              className="w-full min-h-[80px] p-2 bg-gray-50 text-gray-300 rounded border border-gray-100"
            >
              <span className="text-sm">{format(day, 'd')}</span>
            </div>
          );
        }

        return (
          <CalendarDay
            key={day.toString()}
            day={day}
            entries={[]} // This would be populated from actual entries in a real implementation
            isSelected={isSelected}
            isToday={dateFnsIsToday(day)}
            onClick={onDayClick}
            isComplete={false} // This would be determined by actual entries
            totalHours={0} // This would be calculated from actual entries
            isWeekend={dayState.isWeekend}
            isRDO={false} // This would be determined by work schedule
            isWorkDay={dayState.isWorkingDay}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
