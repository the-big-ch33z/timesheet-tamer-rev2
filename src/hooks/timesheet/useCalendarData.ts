
import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from "date-fns";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { Holiday, getHolidays } from "@/lib/holidays";
import { WorkSchedule } from "@/types";
import { createTimeLogger } from "@/utils/time/errors";
import { areSameDates } from "@/utils/time/validation";
import { useCalendarHelpers } from "@/components/timesheet/calendar/useCalendarHelpers";
import { useTimeCompletion } from "@/hooks/timesheet/useTimeCompletion";
import { getFortnightWeek, getWeekDay } from "@/utils/time/scheduleUtils";
import { getShiftedRDODate, getRDOShiftReason } from "@/utils/time/rdoDisplay";

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
    shiftReason: string | null;
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
    
    // Track which dates have already been used as shifted RDOs to prevent conflicts
    const shiftedDates = new Set<string>();
    
    const days = daysInMonth.map(day => {
      const dayEntries = getDayEntries(day);
      const workHours = userId ? getWorkHoursForDate(day, userId) : null;
      
      if (!workHours && userId) {
        logger.debug(`No work hours found for date: ${day.toISOString()}, userId: ${userId}`);
      }
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const baseState = getDayState(day, selectedDate, monthStart);
      const holiday = holidays.find(h => areSameDates(new Date(h.date), day));
      
      let isRDO = false;
      let shiftedRDODate: Date | null = null;
      let dayWorkHours = null;
      let shiftReason: string | null = null;
      
      if (workSchedule) {
        const weekdayName = getWeekDay(day);
        const fortnightWeek = getFortnightWeek(day);
        
        isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekdayName);
        
        if (isRDO) {
          // Check if this date needs to be shifted (holiday or weekend)
          shiftedRDODate = getShiftedRDODate(day, holidays);
          
          if (shiftedRDODate) {
            const shiftedKey = shiftedRDODate.toISOString().split('T')[0];
            
            // If this shifted date is already taken, try to find the next available date
            while (shiftedDates.has(shiftedKey)) {
              shiftedRDODate = getShiftedRDODate(new Date(shiftedRDODate.setDate(shiftedRDODate.getDate() + 1)), holidays);
              if (!shiftedRDODate) break;
            }
            
            if (shiftedRDODate) {
              shiftedDates.add(shiftedKey);
              shiftReason = getRDOShiftReason(day, shiftedRDODate, holidays);
            }
          }
        }
        
        if (workSchedule.weeks[fortnightWeek]?.[weekdayName]) {
          dayWorkHours = workSchedule.weeks[fortnightWeek][weekdayName];
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
          isWorkDay: baseState.isWorkingDay && !isRDO && !holiday,
          shiftReason
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
