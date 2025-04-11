
import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday, getHolidays } from "@/lib/holidays";
import CalendarHeader from "./calendar/CalendarHeader";
import CalendarLegend from "./calendar/CalendarLegend";
import CalendarWeekdayHeader from "./calendar/CalendarWeekdayHeader";
import CalendarGrid from "./calendar/CalendarGrid";

interface TimesheetCalendarProps {
  currentMonth: Date;
  entries: TimeEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
}

const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  currentMonth,
  entries,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  useEffect(() => {
    // Load holidays
    setHolidays(getHolidays());
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthStartDay = getDay(monthStart);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onDayClick(day);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <CalendarHeader 
          currentMonth={currentMonth}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
        
        {/* Calendar Legend */}
        <CalendarLegend hasWorkSchedule={!!workSchedule} />

        {/* Weekday Headers */}
        <CalendarWeekdayHeader />

        {/* Calendar Grid */}
        <CalendarGrid 
          daysInMonth={daysInMonth}
          monthStartDay={monthStartDay}
          entries={entries}
          selectedDate={selectedDate}
          workSchedule={workSchedule}
          holidays={holidays}
          onDayClick={handleDayClick}
        />
      </CardContent>
    </Card>
  );
};

export default TimesheetCalendar;
