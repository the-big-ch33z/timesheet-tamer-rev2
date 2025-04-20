import React from "react";
import { useCalendarData } from "../hooks/useCalendarData";
import CalendarDay from "./CalendarDay";
import { useTimeCompletion } from "@/hooks/timesheet/useTimeCompletion";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";

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

  const processedDays = days.map(day => {
    const workHours = getWorkHoursForDate(day.date);
    const { isComplete } = useTimeCompletion(
      day.entries,
      workHours?.startTime,
      workHours?.endTime
    );

    return {
      ...day,
      isComplete: isComplete || day.isComplete
    };
  });

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
