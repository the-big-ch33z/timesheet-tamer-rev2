
import React, { useCallback, useEffect, useState } from "react";
import { format, isSameMonth, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkSchedule } from "@/types";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import CalendarDay from "./CalendarDay";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
  userId: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  onDayClick,
  workSchedule,
  userId
}) => {
  const { getDayEntries } = useTimeEntryContext();
  const [days, setDays] = useState<Date[]>([]);

  // Generate calendar days
  useEffect(() => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Calculate padding days for the start of the month
    const startPadding = firstDayOfMonth.getDay();
    const paddingStart = new Date(firstDayOfMonth);
    paddingStart.setDate(paddingStart.getDate() - startPadding);

    const newDays: Date[] = [];
    
    // Add padding days from previous month
    for (let i = 0; i < startPadding; i++) {
      const paddingDate = new Date(paddingStart);
      paddingDate.setDate(paddingDate.getDate() + i);
      newDays.push(paddingDate);
    }

    // Add days of the current month
    let currentDay = new Date(firstDayOfMonth);
    while (currentDay <= lastDayOfMonth) {
      newDays.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Add padding days for the end of the month to complete the grid
    const endPadding = 42 - newDays.length; // 6 rows * 7 days = 42
    let lastDate = new Date(lastDayOfMonth);
    for (let i = 1; i <= endPadding; i++) {
      lastDate.setDate(lastDate.getDate() + 1);
      newDays.push(new Date(lastDate));
    }

    setDays(newDays);
    console.log("Calendar days generated:", newDays.length, "for month:", currentMonth.toString());
  }, [currentMonth]);

  return (
    <div className="grid grid-cols-7 gap-0.5 mt-2">
      {days.map((day) => {
        const isWorkDay = true; // This will be determined by the CalendarDay component
        const dayEntries = getDayEntries(day, userId);

        return (
          <CalendarDay
            key={day.toISOString()}
            day={day}
            entries={dayEntries}
            isSelected={selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') : false}
            isToday={format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')}
            onClick={() => onDayClick(day)}
            isWorkDay={isWorkDay}
            totalHours={dayEntries.reduce((sum, entry) => sum + entry.hours, 0)}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
