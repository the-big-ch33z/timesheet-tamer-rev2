
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import CalendarDay from "./CalendarDay";
import { useCalendarHelpers } from "./useCalendarHelpers";
import { Holiday } from "@/lib/holidays";
import { areSameDates, formatDateForComparison } from "@/utils/time/validation";

interface CalendarGridProps {
  daysInMonth: Date[];
  monthStartDay: number;
  entries: TimeEntry[];
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  holidays: Holiday[];
  onDayClick: (day: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  daysInMonth,
  monthStartDay,
  entries,
  selectedDate,
  workSchedule,
  holidays,
  onDayClick
}) => {
  const { getDayStatus } = useCalendarHelpers();
  const today = new Date();

  const getDayEntries = (day: Date) => {
    return entries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return formatDateForComparison(entryDate) === formatDateForComparison(day);
    });
  };

  const isDateSelected = (day: Date) => {
    return selectedDate && areSameDates(day, selectedDate);
  };

  const isToday = (day: Date) => {
    return areSameDates(day, today);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Empty cells for days before the start of the month */}
      {Array.from({ length: monthStartDay }).map((_, i) => (
        <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-100 border border-gray-200 rounded" />
      ))}

      {/* Days of the month */}
      {daysInMonth.map((day) => {
        const dayEntries = getDayEntries(day);
        const status = getDayStatus(day, workSchedule, holidays);
        
        return (
          <CalendarDay
            key={day.toString()}
            day={day}
            entries={dayEntries}
            isSelected={isDateSelected(day)}
            isToday={isToday(day)}
            status={status}
            onDayClick={onDayClick}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
