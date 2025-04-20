
import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from "date-fns";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useCalendarHelpers } from "../calendar/useCalendarHelpers";
import { Holiday, getHolidays } from "@/lib/holidays";
import { WorkSchedule } from "@/types";
import { createTimeLogger } from "@/utils/time/errors";
import { areSameDates, formatDateForComparison } from "@/utils/time/validation";

const logger = createTimeLogger('useCalendarData');

export function useCalendarData(
  currentMonth: Date,
  selectedDate: Date | null,
  workSchedule?: WorkSchedule
) {
  const { entries, getDayEntries } = useTimeEntryContext();
  const { getDayState } = useCalendarHelpers(workSchedule);
  
  return useMemo(() => {
    logger.debug(`Calculating calendar data for month: ${currentMonth.toISOString()}`);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartDay = getDay(monthStart);
    
    const holidays = getHolidays();
    const today = new Date();
    
    const days = daysInMonth.map(day => {
      // Get entries for this specific day using the context's getDayEntries
      const dayEntries = getDayEntries(day);
      
      logger.debug(`Processing day ${formatDateForComparison(day)}, found ${dayEntries.length} entries`);
      
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
        isComplete: false, // This will be calculated in CalendarGrid
        totalHours
      };
    });
    
    logger.debug(`Calendar data calculation complete. Month has ${days.length} days`);
    
    return {
      days,
      monthStartDay
    };
  }, [currentMonth, entries, selectedDate, workSchedule, getDayState, getDayEntries]);
}
