
import { useMemo } from "react";
import { WorkSchedule } from "@/types";
import { isWeekend, isToday } from "date-fns";
import { isWorkingDay } from "@/utils/time/scheduleUtils";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { format } from "date-fns";

/**
 * Helper hook for calendar functionality
 */
export const useCalendarHelpers = (workSchedule?: WorkSchedule) => {
  /**
   * Check if a date is a working day
   */
  const checkIsWorkingDay = useMemo(() => 
    (day: Date) => !isWeekend(day) || (workSchedule ? isWorkingDay(day, workSchedule) : false),
    [workSchedule]
  );

  /**
   * Get various calendar state information for a day
   */
  const getDayState = useMemo(() => 
    (day: Date, selectedDay: Date | null, monthStart: Date) => {
      const _isToday = isToday(day);
      const _isSelected = selectedDay ? day.toDateString() === selectedDay.toDateString() : false;
      const _isCurrentMonth = day.getMonth() === monthStart.getMonth();
      const _isWeekend = isWeekend(day);
      const _isWorkingDay = checkIsWorkingDay(day);

      let weekday = null;
      let fortnightWeek = null;

      // Only calculate these if we have a work schedule
      if (workSchedule) {
        weekday = getWeekDay(day);
        fortnightWeek = getFortnightWeek(day);
      }

      return {
        isToday: _isToday,
        isSelected: _isSelected,
        isCurrentMonth: _isCurrentMonth,
        isWeekend: _isWeekend,
        isWorkingDay: _isWorkingDay,
        weekday,
        fortnightWeek
      };
    },
    [workSchedule, checkIsWorkingDay]
  );
  
  /**
   * Get start and end time for a specific day from work schedule
   */
  const getStartAndEndTimeForDay = useMemo(() => 
    (day: Date) => {
      if (!workSchedule) {
        return { startTime: undefined, endTime: undefined };
      }

      try {
        const weekday = getWeekDay(day);
        const fortnightWeek = getFortnightWeek(day);
        
        // Check if the day exists in the work schedule and is not an RDO
        if (
          workSchedule.weeks[fortnightWeek] && 
          workSchedule.weeks[fortnightWeek][weekday] &&
          !workSchedule.rdoDays[fortnightWeek].includes(weekday)
        ) {
          const dayConfig = workSchedule.weeks[fortnightWeek][weekday];
          return {
            startTime: dayConfig?.startTime,
            endTime: dayConfig?.endTime
          };
        }
        
        return { startTime: undefined, endTime: undefined };
      } catch (error) {
        console.error(`Error getting schedule for ${format(day, 'yyyy-MM-dd')}:`, error);
        return { startTime: undefined, endTime: undefined };
      }
    },
    [workSchedule]
  );
  
  // For backward compatibility and to fix the current errors
  const getDayStatus = getDayState;

  return { getDayState, getDayStatus, checkIsWorkingDay, getStartAndEndTimeForDay };
};

