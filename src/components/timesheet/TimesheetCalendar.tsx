
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
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between bg-white">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b gap-0.5 bg-gray-100 p-0.5">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
            <div
              key={day}
              className={`p-2 text-center text-sm font-medium bg-white ${
                i === 0 || i === 6 ? "text-red-500" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 bg-gray-100 p-0.5">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white p-4 min-h-[80px]" />
          ))}

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
                className={`p-2 min-h-[80px] bg-white cursor-pointer hover:bg-gray-50 transition-all duration-200 ease-in-out ${
                  isToday ? "border-indigo-500 border-2" : ""
                } ${
                  dayHoliday ? "bg-amber-50" : ""
                } ${
                  day.getDay() === 0 ? "border-l-2 border-l-red-100" : ""
                } ${
                  day.getDay() === 6 ? "border-r-2 border-r-red-100" : ""
                } ${
                  isSelected ? "transform scale-[1.02] shadow-md z-10 bg-indigo-50 ring-2 ring-indigo-300" : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`inline-block w-6 h-6 text-center ${
                      isToday
                        ? "bg-indigo-500 text-white rounded-full"
                        : isWeekend ? "text-red-500" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEntries && (
                    <span className="text-xs font-medium text-indigo-700">{totalHours}h</span>
                  )}
                </div>
                {hasEntries && (
                  <div className="mt-1">
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
                {dayHoliday && (
                  <div className="text-xs text-amber-700 mt-1">
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
