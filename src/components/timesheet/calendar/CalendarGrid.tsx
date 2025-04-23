import React, { useMemo } from "react";
import { useCalendarData } from "@/hooks/timesheet/useCalendarData";
import CalendarDay from "./CalendarDay";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";
import { WorkSchedule } from "@/types";
import { getFortnightWeek, getWeekDay } from "@/utils/time/scheduleUtils";

const logger = createTimeLogger("CalendarGrid");

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  onDayClick: (day: Date) => void;
  userId: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  workSchedule,
  onDayClick,
  userId,
}) => {
  const { days } = useCalendarData(
    currentMonth,
    selectedDate,
    workSchedule,
    userId
  );
  const { getWorkHoursForDate } = useTimesheetWorkHours();

  const processedDays = useMemo(() => {
    return days.map((day) => {
      const dateObj = new Date(day.date);

      // Get scheduled hours for this day
      const workHours = getWorkHoursForDate(dateObj, userId);
      const weekday = getWeekDay(dateObj);
      const fortnightWeek = getFortnightWeek(dateObj);

      // Determine if it's an RDO
      const isRdo =
        workSchedule?.rdoDays?.[fortnightWeek]?.includes(weekday) || false;

      const { isComplete } = calculateCompletion(
        day.entries ?? [],
        workHours?.startTime,
        workHours?.endTime
      );

      return {
        ...day,
        date: dateObj,
        entries: day.entries ?? [],
        isComplete,
        isRdo,
      };
    });
  }, [days, getWorkHoursForDate, userId, workSchedule]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {processedDays.map((day) => (
        <CalendarDay
          key={day.date.toISOString()}
          day={day.date}
          entries={day.entries}
          isSelected={
            selectedDate
              ? day.date.toDateString() === selectedDate.toDateString()
              : false
          }
          onClick={() => onDayClick(day.date)}
          isToday={false}
          status={{
            isWeekend: false,
            dayHoliday: false,
            holidayName: null,
            isRDO: day.isRdo,
            workHours: null,
            isWorkDay: true,
            shiftReason: null,
          }}
          isComplete={day.isComplete}
        />
      ))}
    </div>
  );
};

export default CalendarGrid;
