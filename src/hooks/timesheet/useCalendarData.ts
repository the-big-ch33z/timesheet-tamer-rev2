
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
import { getShiftedRDODate } from "@/utils/time/rdoDisplay";

const logger = createTimeLogger('useCalendarData');

// Interface for tracking original RDO info when shifted
interface ShiftedRDOInfo {
  originalDate: Date;
  shiftedDate: Date;
  reason: string | null;
}

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
    originalRdoDate?: Date; // Track the original date for shifted RDOs
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
    
    // Map to track which dates have shifted RDOs assigned to them
    const shiftedRDOMap = new Map<string, ShiftedRDOInfo>();
    const shiftedDates = new Set<string>();
    
    // First pass: identify all RDOs and their potential shifts
    if (workSchedule) {
      daysInMonth.forEach(day => {
        const weekdayName = getWeekDay(day);
        const fortnightWeek = getFortnightWeek(day);
        
        // Check if this is an RDO
        const isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekdayName);
        
        if (isRDO) {
          // Get shift information
          const shiftInfo = getShiftedRDODate(day, holidays);
          
          if (shiftInfo.shifted) {
            const shiftedKey = shiftInfo.shifted.toISOString().split('T')[0];
            
            // If this shifted date is already taken, try to find the next available date
            let currentShiftedDate = shiftInfo.shifted;
            let attempts = 0;
            const maxAttempts = 5;
            
            while (shiftedDates.has(shiftedKey) && attempts < maxAttempts) {
              attempts++;
              const newShiftInfo = getShiftedRDODate(new Date(currentShiftedDate.setDate(currentShiftedDate.getDate() + 1)), holidays);
              if (!newShiftInfo.shifted) break;
              currentShiftedDate = newShiftInfo.shifted;
            }
            
            const finalShiftedKey = currentShiftedDate.toISOString().split('T')[0];
            
            // Add to our tracking maps
            shiftedDates.add(finalShiftedKey);
            
            shiftedRDOMap.set(finalShiftedKey, {
              originalDate: day,
              shiftedDate: currentShiftedDate,
              reason: shiftInfo.reason
            });
            
            logger.debug(`RDO mapped: ${day.toISOString()} → ${currentShiftedDate.toISOString()}, reason: ${shiftInfo.reason}`);
          }
        }
      });
    }

    // Second pass: create day data using the RDO shift information
    const days = daysInMonth.map(day => {
      const dayEntries = getDayEntries(day);
      
      // Get the standard work hours for this day 
      const workHours = userId ? getWorkHoursForDate(day, userId) : null;
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const baseState = getDayState(day, selectedDate, monthStart);
      const holiday = holidays.find(h => areSameDates(new Date(h.date), day));
      
      let isRDO = false;
      let dayWorkHours = null;
      let shiftReason: string | null = null;
      let originalRdoDate: Date | undefined;
      
      // Check if this day has a shifted RDO assigned to it
      const dateKey = day.toISOString().split('T')[0];
      const hasShiftedRDO = shiftedRDOMap.has(dateKey);
      
      if (workSchedule) {
        const weekdayName = getWeekDay(day);
        const fortnightWeek = getFortnightWeek(day);
        
        if (hasShiftedRDO) {
          // This is a target day for a shifted RDO
          const shiftInfo = shiftedRDOMap.get(dateKey)!;
          isRDO = true;
          shiftReason = shiftInfo.reason;
          originalRdoDate = shiftInfo.originalDate;
          
          // Use the original date's schedule for work hours
          const originalWeekday = getWeekDay(originalRdoDate);
          const originalFortnight = getFortnightWeek(originalRdoDate);
          
          // Get scheduled hours from the original RDO date's weekday
          if (workSchedule.weeks[originalFortnight]?.[originalWeekday]) {
            dayWorkHours = workSchedule.weeks[originalFortnight][originalWeekday];
            logger.debug(`Using original RDO work hours from ${originalRdoDate.toISOString()} (${originalWeekday}) for shifted RDO on ${day.toISOString()}`);
          }
        } else {
          // This is a regular day (may be a regular RDO)
          isRDO = workSchedule.rdoDays[fortnightWeek].includes(weekdayName);
          
          // Get work hours for this day from the schedule
          if (workSchedule.weeks[fortnightWeek]?.[weekdayName] && !isRDO) {
            dayWorkHours = workSchedule.weeks[fortnightWeek][weekdayName];
          }
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
          originalRdoDate,
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
