import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay, format } from "date-fns";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { useCalendarHelpers } from "../calendar/useCalendarHelpers";
import { Holiday, getHolidays } from "@/lib/holidays";
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
  const { entries } = useTimeEntryContext();
  const { getDayState } = useCalendarHelpers(workSchedule);
  
  return useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartDay = getDay(monthStart);
    
    const holidays = getHolidays();
    const today = new Date();
    
    const calculateCompletionStatus = (dayEntries: any[], dayWorkHours: { startTime: string; endTime: string } | null) => {
      if (dayEntries.length === 0) return false;
      
      if (!dayWorkHours) return false;
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      const [startHour, startMinute] = dayWorkHours.startTime.split(':').map(Number);
      const [endHour, endMinute] = dayWorkHours.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      const expectedHours = (endTimeInMinutes - startTimeInMinutes) / 60;
      
      const variance = Math.abs(expectedHours - totalHours);
      return variance < 0.1;
    };
    
    const days: DayCellData[] = daysInMonth.map(day => {
      const dayEntries = entries.filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return areSameDates(entryDate, day);
      });
      
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      const baseState = getDayState(day, selectedDate, new Date(day.getFullYear(), day.getMonth(), 1));
      
      const holiday = holidays.find(h => 
        areSameDates(new Date(h.date), day)
      );
      
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
      
      const isComplete = calculateCompletionStatus(dayEntries, dayWorkHours);
      
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
  }, [currentMonth, entries, selectedDate, workSchedule, getDayState]);
}
