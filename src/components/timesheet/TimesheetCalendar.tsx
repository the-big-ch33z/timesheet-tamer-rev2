
import React, { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimeEntry, WorkSchedule } from "@/types";
import { getDayStatus } from "@/utils/time/scheduleUtils";
import { Card } from "@/components/ui/card";

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
  // Get all days in the current month
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Get selected day state for tracking which day is selected in UI
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  // Handle clicking on a day
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    onDayClick(day);
  };

  // Generate days to display in calendar
  const calendarDays = useMemo(() => {
    return days.map((day) => {
      // Check if this day has entries
      const dayEntries = entries.filter((entry) =>
        isSameDay(new Date(entry.date), day)
      );
      
      // Get day status based on work schedule
      const dayStatus = getDayStatus(day, workSchedule);

      // Determine styling classes based on day status
      const isSelected = selectedDay && isSameDay(day, selectedDay);
      const hasEntries = dayEntries.length > 0;

      // Create class names for day cell
      const dayClasses = cn(
        "h-12 w-full cursor-pointer border flex flex-col justify-start items-center p-1 transition-all",
        {
          "bg-blue-50 hover:bg-blue-100": dayStatus === "workday" && !isSelected,
          "bg-gray-200 hover:bg-gray-300": dayStatus === "weekend" && !isSelected,
          "bg-yellow-50 hover:bg-yellow-100": dayStatus === "holiday" && !isSelected,
          "bg-blue-200 font-bold": isSelected,
          "border-blue-300": hasEntries && !isSelected,
          "border-blue-500 border-2": isSelected,
          "text-gray-400": !isSameMonth(day, currentMonth),
          "font-bold": isToday(day),
        }
      );

      return (
        <div
          key={day.toString()}
          className={dayClasses}
          onClick={() => handleDayClick(day)}
        >
          <div className="text-xs">{format(day, "d")}</div>
          
          {/* Dot indicators for entries instead of showing hours */}
          {hasEntries && (
            <div className="flex mt-1 space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              {dayEntries.length > 1 && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              )}
              {dayEntries.length > 2 && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              )}
            </div>
          )}
        </div>
      );
    });
  }, [days, entries, selectedDay, workSchedule, onDayClick]);

  // Create week day headers
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-medium"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays}
      </div>
    </Card>
  );
};

export default TimesheetCalendar;
