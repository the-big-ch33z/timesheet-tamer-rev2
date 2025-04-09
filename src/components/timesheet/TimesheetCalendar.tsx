
import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { TimeEntry } from "@/types";
import { Holiday, isHoliday, getHolidayForDate, getHolidays } from "@/lib/holidays";

interface TimesheetCalendarProps {
  currentMonth: Date;
  entries: TimeEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
}

const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  currentMonth,
  entries,
  onPrevMonth,
  onNextMonth,
  onDayClick,
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

  const getDayEntries = (day: Date) => {
    return entries.filter(
      (entry) => format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  const getTotalHours = (day: Date) => {
    return getDayEntries(day).reduce((total, entry) => total + entry.hours, 0);
  };

  const checkIsHoliday = (day: Date) => {
    return isHoliday(day, holidays);
  };

  const getHolidayName = (day: Date) => {
    const holiday = getHolidayForDate(day, holidays);
    return holiday ? holiday.name : null;
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onDayClick(day);
  };

  const isDateSelected = (day: Date) => {
    return selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={onPrevMonth} className="rounded-full w-10 h-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onNextMonth} className="rounded-full w-10 h-10">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-sm font-medium ${
                i === 0 || i === 6 ? "text-red-500" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the start of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-50 rounded" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const dayEntries = getDayEntries(day);
            const totalHours = getTotalHours(day);
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const hasEntries = dayEntries.length > 0;
            const dayHoliday = checkIsHoliday(day);
            const holidayName = getHolidayName(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isSelected = isDateSelected(day);
            
            return (
              <div
                key={day.toString()}
                className={`p-3 min-h-[80px] rounded cursor-pointer transition-all duration-200 ease-in-out
                  ${isWeekend ? "bg-[#F1F0FB]" : "bg-white"}
                  ${dayHoliday ? "bg-[#FEF7CD]" : ""}
                  ${isToday ? "ring-2 ring-indigo-500" : ""}
                  ${isSelected ? "transform scale-[1.02] shadow-md z-10 ring-2 ring-indigo-400" : ""}
                  hover:bg-gray-100
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-lg font-medium
                      ${isWeekend ? "text-red-500" : ""}
                      ${isToday ? "bg-indigo-500 text-white w-7 h-7 flex items-center justify-center rounded-full" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEntries && (
                    <span className="text-xs font-medium text-indigo-700 px-1 bg-indigo-50 rounded">
                      {totalHours}h
                    </span>
                  )}
                </div>

                {/* Entry indicators */}
                {hasEntries && (
                  <div className="mt-2">
                    {dayEntries.slice(0, 1).map((entry) => (
                      <div
                        key={entry.id}
                        className="text-xs p-1 mb-1 bg-indigo-100 rounded truncate"
                      >
                        {entry.project} ({entry.hours}h)
                      </div>
                    ))}
                    {dayEntries.length > 1 && (
                      <div className="text-xs text-indigo-600">
                        +{dayEntries.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {/* Holiday indicator */}
                {dayHoliday && (
                  <div className="text-xs text-amber-700 mt-1 font-medium">
                    {holidayName || "Holiday"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetCalendar;
