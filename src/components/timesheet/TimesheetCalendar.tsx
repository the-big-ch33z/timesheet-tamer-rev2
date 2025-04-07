
import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { TimeEntry } from "@/types";

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

  // Holiday days (sample data)
  const holidays = [
    "2025-04-18",
    "2025-04-21",
    "2025-04-25"
  ];

  const isHoliday = (day: Date) => {
    return holidays.includes(format(day, "yyyy-MM-dd"));
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

        <div className="grid grid-cols-7 border-b">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
            <div
              key={day}
              className={`p-2 text-center text-sm font-medium ${
                i === 0 || i === 6 ? "text-red-500" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white p-4 border min-h-[80px]" />
          ))}

          {daysInMonth.map((day) => {
            const dayEntries = getDayEntries(day);
            const totalHours = getTotalHours(day);
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const hasEntries = dayEntries.length > 0;
            const dayHoliday = isHoliday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            
            return (
              <div
                key={day.toString()}
                className={`p-2 min-h-[80px] border cursor-pointer hover:bg-gray-50 ${
                  isToday ? "border-indigo-500" : ""
                } ${
                  dayHoliday ? "bg-amber-50" : ""
                } ${
                  day.getDay() === 0 ? "border-l-2 border-l-red-100" : ""
                } ${
                  day.getDay() === 6 ? "border-r-2 border-r-red-100" : ""
                }`}
                onClick={() => onDayClick(day)}
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
                    Holiday
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
