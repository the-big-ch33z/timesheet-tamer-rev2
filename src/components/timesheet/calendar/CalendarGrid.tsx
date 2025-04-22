import React, { useMemo } from "react";
import { useCalendarData } from "@/hooks/timesheet/useCalendarData";
import CalendarDay from "./CalendarDay";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";
import { WorkSchedule } from "@/types";
import { getFortnightWeek, getWeekDay } from "@/utils/time/scheduleUtils";

const logger = createTimeLogger('CalendarGrid');

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
  userId
}) => {
  React.useEffect(() => {
    if (workSchedule) {
      logger.debug(`CalendarGrid received workSchedule: ${workSchedule.name || 'unnamed'}`);
    } else {
      logger.debug('CalendarGrid has no workSchedule');
    }
  }, [workSchedule]);

  const { days, monthStartDay } = useCalendarData(currentMonth, selectedDate, workSchedule, userId);
  const { getWorkHoursForDate } = useTimesheetWorkHours();

  const processedDays = useMemo(() => {
    logger.debug(`Processing ${days.length} days for month ${currentMonth.toISOString()}, userId: ${userId}`);

    return days.map(day => {
      const dateObj = new Date(day.date);
      const workHours = getWorkHoursForDate(dateObj, userId);

      if (!workHours) {
        logger.debug(`No work hours found for date ${dateObj.toISOString()}, userId: ${userId}`);
      }

      const { isComplete } = calculateCompletion(
        day.entries,
        workHours?.startTime,
        workHours?.endTime
      );

      const isRdo = workSchedule?.rdoDays?.[getFortnightWeek(dateObj)]?.includes(
        getWeekDay(dateObj)
      ) || false;

      logger.debug(`Day ${dateObj.toISOString()}: entries=${day.entries?.length ?? 0}, complete=${isComplete}, isRdo=${isRdo}, userId: ${userId}`);

      return {
        ...day,
        date: dateObj,
        entries: day.entries ?? [], // ✅ fallback to empty array to prevent runtime error
        isComplete,
        isRdo
      };
    });
  }, [days, getWorkHoursForDate, userId, workSchedule]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {processedDays.map(day => (
        <CalendarDay
          key={day.date.toISOString()}
          day={day}
          isSelected={selectedDate ? day.date.toDateString() === selectedDate.toDateString() : false}
          onClick={() => onDayClick(day.date)}
        />
      ))}
    </div>
  );
};

export default CalendarGrid;
