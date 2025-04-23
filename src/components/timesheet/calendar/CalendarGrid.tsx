
import React, { useMemo, memo } from "react";
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
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState, getStartAndEndTimeForDay } = useCalendarHelpers(workSchedule);
  
  // Memoize days calculation to prevent recalculation on each render
  const days = useMemo(() => {
    logger.debug("Calculating calendar grid days");
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth, logger]);

  // Pre-calculate data for all days in the visible calendar to avoid per-cell calculations
  const daysData = useMemo(() => {
    logger.debug("Pre-calculating calendar days data");
    const monthStart = startOfMonth(currentMonth);
    
    return days.map(day => {
      const isCurrentMonth = isSameMonth(day, monthStart);
      
      if (!isCurrentMonth) {
        return { 
          day, 
          isCurrentMonth: false 
        };
      }
      
      const dayState = getDayState(day, selectedDate, monthStart);
      const { startTime, endTime } = getStartAndEndTimeForDay(day);
      const entries = getDayEntries(day);
      const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const { isComplete } = calculateCompletion(entries, startTime, endTime);
      
      return {
        day,
        isCurrentMonth: true,
        entries,
        isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
        isToday: dateFnsIsToday(day),
        isComplete,
        totalHours,
        isWeekend: dayState.isWeekend,
        isWorkDay: dayState.isWorkingDay,
        expectedStartTime: startTime,
        expectedEndTime: endTime
      };
    });
  }, [days, selectedDate, getDayEntries, getDayState, getStartAndEndTimeForDay, currentMonth]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {daysData.map((dayData, i) => {
        const { day, isCurrentMonth } = dayData;

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
          <MemoizedCalendarDay
            key={day.toString()}
            day={day}
            entries={dayData.entries}
            isSelected={dayData.isSelected}
            isToday={dayData.isToday}
            onClick={onDayClick}
            isComplete={dayData.isComplete}
            totalHours={dayData.totalHours}
            isWeekend={dayData.isWeekend}
            isRDO={false} // This would be determined by work schedule
            isWorkDay={dayData.isWorkDay}
            expectedStartTime={dayData.expectedStartTime}
            expectedEndTime={dayData.expectedEndTime}
          />
        );
      })}
    </div>
  );
};

// Memoize CalendarDay component for performance optimization
const MemoizedCalendarDay = memo(CalendarDay);

// Memoize entire CalendarGrid component
export default memo(CalendarGrid);
