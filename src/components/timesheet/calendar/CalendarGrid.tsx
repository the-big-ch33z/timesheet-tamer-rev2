
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import CalendarDay from "./CalendarDay";
import { useCalendarHelpers } from "./useCalendarHelpers";
import { Holiday } from "@/lib/holidays";
import { areSameDates, formatDateForComparison } from "@/utils/time/validation";

interface CalendarGridProps {
  daysInMonth: Date[];
  monthStartDay: number;
  entries: TimeEntry[];
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  holidays: Holiday[];
  onDayClick: (day: Date) => void;
}

// Define the DayStatusInfo interface to match what CalendarDay expects
interface DayStatusInfo {
  isWeekend: boolean;
  dayHoliday: boolean;
  holidayName: string | null;
  isRDO: boolean;
  workHours: { startTime: string; endTime: string } | null;
  isWorkDay: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  daysInMonth,
  monthStartDay,
  entries,
  selectedDate,
  workSchedule,
  holidays,
  onDayClick
}) => {
  const { getDayState } = useCalendarHelpers();
  const today = new Date();

  const getDayEntries = (day: Date) => {
    return entries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return formatDateForComparison(entryDate) === formatDateForComparison(day);
    });
  };

  const isDateSelected = (day: Date) => {
    return selectedDate && areSameDates(day, selectedDate);
  };

  const isToday = (day: Date) => {
    return areSameDates(day, today);
  };

  // Convert from getDayState output to DayStatusInfo format
  const getDayStatus = (day: Date): DayStatusInfo => {
    // Get the base state from useCalendarHelpers
    const baseState = getDayState(day, selectedDate, new Date(day.getFullYear(), day.getMonth(), 1));
    
    // Get holiday information
    const holiday = holidays.find(h => 
      formatDateForComparison(new Date(h.date)) === formatDateForComparison(day)
    );
    
    // Check if it's an RDO using the workSchedule
    let isRDO = false;
    let dayWorkHours = null;
    
    if (workSchedule) {
      // This is a simplified version - in a real app, you would likely have
      // more complex logic to determine if it's an RDO based on the workSchedule
      const scheduleInfo = workSchedule.weeks;
      const weekdayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
      
      // Basic check for RDO
      isRDO = workSchedule.rdoDays[1].includes(weekdayName as any) || 
              workSchedule.rdoDays[2].includes(weekdayName as any);
      
      // Get work hours if defined for this day
      const week = 1; // Simplified - would need logic to determine the actual week
      if (scheduleInfo[week] && scheduleInfo[week][weekdayName as any]) {
        dayWorkHours = scheduleInfo[week][weekdayName as any];
      }
    }
    
    // Return in the format expected by CalendarDay
    return {
      isWeekend: baseState.isWeekend,
      dayHoliday: !!holiday,
      holidayName: holiday ? holiday.name : null,
      isRDO: isRDO,
      workHours: dayWorkHours,
      isWorkDay: baseState.isWorkingDay && !isRDO && !holiday
    };
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Empty cells for days before the start of the month */}
      {Array.from({ length: monthStartDay }).map((_, i) => (
        <div key={`empty-${i}`} className="p-3 min-h-[80px] bg-gray-100 border border-gray-200 rounded" />
      ))}

      {/* Days of the month */}
      {daysInMonth.map((day) => {
        const dayEntries = getDayEntries(day);
        const status = getDayStatus(day);
        
        return (
          <CalendarDay
            key={day.toString()}
            day={day}
            entries={dayEntries}
            isSelected={isDateSelected(day)}
            isToday={isToday(day)}
            status={status}
            onDayClick={onDayClick}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
