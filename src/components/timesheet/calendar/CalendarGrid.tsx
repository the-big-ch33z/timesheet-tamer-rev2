
import React from "react";
import { useCalendarData } from "../hooks/useCalendarData";
import CalendarDay from "./CalendarDay";

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
  // Use our new hook to get all the day data
  const { days, monthStartDay } = useCalendarData(currentMonth, selectedDate, workSchedule);

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Empty cells for days before month starts */}
      {Array.from({ length: monthStartDay }).map((_, i) => (
        <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-100 border border-gray-200 rounded" />
      ))}

      {/* Day cells */}
      {days.map((day) => (
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

export default CalendarGrid;
