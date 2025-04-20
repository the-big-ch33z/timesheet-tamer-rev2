import React, { useMemo } from "react";
import { useCalendarData } from "@/hooks/timesheet/useCalendarData";
import CalendarDay from "./CalendarDay";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";

const logger = createTimeLogger('CalendarGrid');

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: any;
  onDayClick: (day: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  workSchedule,
  onDayClick
}) => {
  const { days, monthStartDay } = useCalendarData(currentMonth, selectedDate, workSchedule);
  const { getWorkHoursForDate } = useTimesheetWorkHours();

  const processedDays = useMemo(() => {
    logger.debug(`Processing ${days.length} days for month ${currentMonth.toISOString()}`);
    
    return days.map(day => {
      const workHours = getWorkHoursForDate(day.date);
      const { isComplete } = calculateCompletion(
        day.entries,
        workHours?.startTime,
        workHours?.endTime
      );

      logger.debug(`Day ${day.date.toISOString()}: entries=${day.entries.length}, complete=${isComplete}`);

      return {
        ...day,
        isComplete
      };
    });
  }, [days, getWorkHoursForDate]);

  // Log when days or completion status changes
  React.useEffect(() => {
    logger.debug(`Calendar grid updated with ${processedDays.length} days`);
    processedDays.forEach(day => {
      if (day.entries.length > 0) {
        logger.debug(`Day ${day.date.toISOString()} has ${day.entries.length} entries, complete: ${day.isComplete}`);
      }
    });
  }, [processedDays]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: monthStartDay }).map((_, i) => (
        <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-100 border border-gray-200 rounded" />
      ))}

      {processedDays.map((day) => (
        <CalendarDay
          key={day.date.toString()}
          day={day.date}
          entries={day.entries}
          isSelected={day.isSelected}
          isToday={day.isToday}
          status={day.status}
          onDayClick={onDayClick}
          isComplete={day.isComplete}
          totalHours={day.totalHours}
        />
      ))}
    </div>
  );
};

export default React.memo(CalendarGrid);
