
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
  // Log when workSchedule changes
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
      const workHours = getWorkHoursForDate(day.date, userId);
      
      if (!workHours) {
        logger.debug(`No work hours found for date ${day.date.toISOString()}, userId: ${userId}`);
      }
      
      const { isComplete } = calculateCompletion(
        day.entries,
        workHours?.startTime,
        workHours?.endTime
      );

      // Check if it's an RDO based on the fortnight week
      const isRdo = workSchedule?.rdoDays?.[getFortnightWeek(day.date)]?.includes(
        getWeekDay(day.date)
      ) || false;

      logger.debug(`Day ${day.date.toISOString()}: entries=${day.entries.length}, complete=${isComplete}, isRdo=${isRdo}, userId: ${userId}`);

      return {
        ...day,
        isComplete,
        isRdo
      };
    });
  }, [days, getWorkHoursForDate, userId, workSchedule]);

  React.useEffect(() => {
    logger.debug(`Calendar grid updated with ${processedDays.length} days, using workSchedule: ${workSchedule?.id || 'none'}`);
    
    // Log days with special status
    const specialDays = processedDays.filter(day => day.status.isRDO || day.status.dayHoliday);
    if (specialDays.length > 0) {
      logger.debug(`Found ${specialDays.length} special days in the month`);
      specialDays.forEach(day => {
        if (day.status.isRDO) {
          logger.debug(`Day ${day.date.toISOString()} is marked as RDO`);
        }
        if (day.status.dayHoliday) {
          logger.debug(`Day ${day.date.toISOString()} is marked as holiday: ${day.status.holidayName}`);
        }
      });
    }
  }, [processedDays, workSchedule]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: monthStartDay }).map((_, i) => (
        <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-100 border border-gray-200 rounded" />
      ))}

      {processedDays.map((day) => (
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

export default React.memo(CalendarGrid);
