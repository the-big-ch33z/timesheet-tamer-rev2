
import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from "date-fns";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { Holiday, getHolidays } from "@/lib/holidays";
import { WorkSchedule } from "@/types";
import { createTimeLogger } from "@/utils/time/errors";
import { areSameDates, formatDateForComparison } from "@/utils/time/validation";
import { useCalendarHelpers } from "@/components/timesheet/calendar/useCalendarHelpers";
import { useTimeCompletion } from "@/hooks/timesheet/useTimeCompletion";

const logger = createTimeLogger('useCalendarData');

export interface DayCellData {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  status: {
    isWeekend: boolean;
    dayHoliday: boolean;
    holidayName: string | null;
    isRDO: boolean;
    workHours: { startTime: string; endTime: string } | null;
    isWorkDay: boolean;
  };
  entries: any[];
  isComplete: boolean;
  totalHours: number;
}

export function useCalendarData(
  currentMonth: Date,
  selectedDate: Date | null,
  workSchedule?: WorkSchedule
) {
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState } = useCalendarHelpers(workSchedule);
  const { getWorkHoursForDate } = useTimesheetWorkHours();
  
  return useMemo(() => {
    logger.debug(`Calculating calendar data for month: ${currentMonth.toISOString()}`);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartDay = getDay(monthStart);
    
    const holidays = getHolidays();
    const today = new Date();
    
    const days = daysInMonth.map(day => {
      // Get entries for this specific day using context
      const dayEntries = getDayEntries(day);
      const workHours = getWorkHoursForDate(day);
      
      logger.debug(`Processing ${formatDateForComparison(day)}: found ${dayEntries.length} entries`);
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      const baseState = getDayState(day, selectedDate, monthStart);
      
      const holiday = holidays.find(h => areSameDates(new Date(h.date), day));
      
      let isRDO = false;
      let dayWorkHours = null;
      
      if (workSchedule) {
        const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
        isRDO = workSchedule.rdoDays[1].includes(weekdayName as any) || 
                workSchedule.rdoDays[2].includes(weekdayName as any);
        
        const week = 1;
        if (workSchedule.weeks[week] && workSchedule.weeks[week][weekdayName as any]) {
          dayWorkHours = workSchedule.weeks[week][weekdayName as any];
        }
      }

      const { isComplete } = useTimeCompletion(
        dayEntries,
        workHours?.startTime,
        workHours?.endTime
      );

      return {
        date: day,
        isSelected: selectedDate ? areSameDates(day, selectedDate) : false,
        isToday: areSameDates(day, today),
        status: {
          isWeekend: baseState.isWeekend,
          dayHoliday: !!holiday,
          holidayName: holiday ? holiday.name : null,
          isRDO,
          workHours: dayWorkHours,
          isWorkDay: baseState.isWorkingDay && !isRDO && !holiday
        },
        entries: dayEntries,
        isComplete,
        totalHours
      };
    });
    
    logger.debug(`Calendar data calculation complete. Month has ${days.length} days`);
    
    return {
      days,
      monthStartDay
    };
  }, [currentMonth, selectedDate, workSchedule, getDayEntries, getDayState, getWorkHoursForDate]);
}
