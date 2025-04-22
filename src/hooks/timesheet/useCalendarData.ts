
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
import { getFortnightWeek, getWeekDay } from "@/utils/time/scheduleUtils";
import { getShiftedRDODate } from "@/utils/time/rdoDisplay";

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
  workSchedule?: WorkSchedule,
  userId?: string
) {
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState } = useCalendarHelpers(workSchedule);
  const { getWorkHoursForDate } = useTimesheetWorkHours();
  
  return useMemo(() => {
    logger.debug(`Calculating calendar data for month: ${currentMonth.toISOString()}, userId: ${userId}`);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartDay = getDay(monthStart);
    
    const holidays = getHolidays();
    const today = new Date();
    
    const days = daysInMonth.map(day => {
      const dayEntries = getDayEntries(day);
      const workHours = userId ? getWorkHoursForDate(day, userId) : null;
      
      if (!workHours && userId) {
        logger.debug(`No work hours found for ${formatDateForComparison(day)} — userId: ${userId}`);
      }
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      const baseState = getDayState(day, selectedDate, monthStart);
      
      const holiday = holidays.find(h => areSameDates(new Date(h.date), day));
      
      let isRDO = false;
      let shiftedRDODate: Date | null = null;
      let dayWorkHours = null;
      
      if (workSchedule) {
        const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
        const fortnightWeek = getFortnightWeek(day);
        
        // Check if this day is an RDO in the schedule
        isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekdayName as any);
        
        // If it's an RDO and falls on a holiday, calculate shifted date
        if (isRDO && holiday) {
          shiftedRDODate = getShiftedRDODate(day, holidays);
          logger.debug(`RDO on holiday detected: ${formatDateForComparison(day)}, shifted to: ${shiftedRDODate ? formatDateForComparison(shiftedRDODate) : 'none'}`);
        }
        
        if (workSchedule.weeks[fortnightWeek] && workSchedule.weeks[fortnightWeek][weekdayName as any]) {
          dayWorkHours = workSchedule.weeks[fortnightWeek][weekdayName as any];
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
          shiftedRDODate,
          workHours: dayWorkHours,
          isWorkDay: baseState.isWorkingDay && !isRDO && !holiday
        },
        entries: dayEntries,
        isComplete,
        totalHours
      };
    });
    
    return {
      days,
      monthStartDay
    };
  }, [currentMonth, selectedDate, workSchedule, userId, getDayEntries, getDayState, getWorkHoursForDate]);
}
