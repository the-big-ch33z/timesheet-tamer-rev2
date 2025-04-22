
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
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";

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
  // Use time entry context to get entries for each day
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState, getStartAndEndTimeForDay } = useCalendarHelpers(workSchedule);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const dayState = getDayState(day, selectedDate, startOfMonth(currentMonth));
        const isCurrentMonth = isSameMonth(day, startOfMonth(currentMonth));
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

        // Get start and end time for the day from work schedule
        const { startTime, endTime } = getStartAndEndTimeForDay(day);

        // Get all entries for this day and calculate total hours
        const entries = getDayEntries(day);
        const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        
        // Calculate if day is complete (hours match expected)
        const { isComplete } = calculateCompletion(entries, startTime, endTime);

        if (!isCurrentMonth) {
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
            entries={entries}
            isSelected={isSelected}
            isToday={dateFnsIsToday(day)}
            onClick={onDayClick}
            isComplete={isComplete}
            totalHours={totalHours}
            isWeekend={dayState.isWeekend}
            isRDO={false} // This would be determined by work schedule
            isWorkDay={dayState.isWorkingDay}
            expectedStartTime={startTime}
            expectedEndTime={endTime}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;

