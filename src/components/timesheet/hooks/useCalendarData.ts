
import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from "date-fns";
import { isSameDay } from "date-fns";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useCalendarHelpers } from "../calendar/useCalendarHelpers";
import { Holiday, getHolidays } from "@/lib/holidays";
import { useTimeCompletion } from "@/hooks/timesheet/useTimeCompletion";
import { WorkSchedule } from "@/types";
import { areSameDates } from "@/utils/time/validation";

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
  // Get entries from context - ONE hook call, not in a loop
  const { entries } = useTimeEntryContext();
  const { getDayState } = useCalendarHelpers(workSchedule);
  
  return useMemo(() => {
    // Get all days for current month grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartDay = getDay(monthStart);
    
    // Get holidays - moved out of render cycle
    const holidays = getHolidays();
    const today = new Date();
    
    // Create cell data for each day
    const days: DayCellData[] = daysInMonth.map(day => {
      // Find entries for this day
      const dayEntries = entries.filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return areSameDates(entryDate, day);
      });
      
      // Calculate total hours
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      // Get day state (weekend, etc)
      const baseState = getDayState(day, selectedDate, new Date(day.getFullYear(), day.getMonth(), 1));
      
      // Get holiday information
      const holiday = holidays.find(h => 
        areSameDates(new Date(h.date), day)
      );
      
      // Get RDO and work hours info
      let isRDO = false;
      let dayWorkHours = null;
      
      if (workSchedule) {
        // RDO calculation
        const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
        isRDO = workSchedule.rdoDays[1].includes(weekdayName as any) || 
                workSchedule.rdoDays[2].includes(weekdayName as any);
        
        // Work hours
        const week = 1; // Simplified - would need logic to determine the actual week
        if (workSchedule.weeks[week] && workSchedule.weeks[week][weekdayName as any]) {
          dayWorkHours = workSchedule.weeks[week][weekdayName as any];
        }
      }
      
      // Check completion status
      let isComplete = false;
      if (workSchedule && dayEntries.length > 0) {
        const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
        const week = 1;
        const scheduleHours = workSchedule.weeks[week][weekdayName as keyof typeof workSchedule.weeks[typeof week]];

        if (scheduleHours) {
          const { isComplete: complete } = useTimeCompletion(
            dayEntries,
            scheduleHours.startTime,
            scheduleHours.endTime
          );
          isComplete = complete;
        }
      }
      
      // Return formatted day data
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
    
    return {
      days,
      monthStartDay
    };
  }, [currentMonth, entries, selectedDate, workSchedule]);
}
