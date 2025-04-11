
import { WeekDay, WorkSchedule, Holiday } from "@/types";
import { format } from "date-fns";
import { startOfYear } from "date-fns";

export interface DayStatus {
  isWeekend: boolean;
  dayHoliday: boolean;
  holidayName: string | null;
  isRDO: boolean;
  workHours: any;
  isWorkDay: boolean;
}

export const useCalendarHelpers = () => {
  // Helper function to convert JS day number to WeekDay type
  const getWeekDayFromDate = (date: Date): WeekDay => {
    const dayMap: Record<number, WeekDay> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    return dayMap[date.getDay()];
  };

  // Determine which fortnight week (1 or 2) a given date falls into
  const getFortnightWeek = (date: Date): 1 | 2 => {
    // Start of the year as a reference point
    const yearStart = startOfYear(new Date(date.getFullYear(), 0, 1));
    
    // Calculate weeks since start of year (0-indexed)
    const weeksSinceYearStart = Math.floor(
      (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    
    // Convert to 1 or 2 based on odd or even week number
    return ((weeksSinceYearStart % 2) + 1) as 1 | 2;
  };

  // Check if a day is a working day according to the schedule
  const isWorkingDay = (day: Date, workSchedule?: WorkSchedule): boolean => {
    if (!workSchedule) return true; // Default to working day if no schedule

    const weekDay = getWeekDayFromDate(day);
    const weekNum = getFortnightWeek(day);
    
    // Check if it's an RDO
    if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
      return false;
    }
    
    // Check if there are work hours defined for this day
    const hoursForDay = workSchedule.weeks[weekNum][weekDay];
    return hoursForDay !== null;
  };

  // Get work hours for a specific day
  const getWorkHoursForDay = (day: Date, workSchedule?: WorkSchedule) => {
    if (!workSchedule) return null;
    
    const weekDay = getWeekDayFromDate(day);
    const weekNum = getFortnightWeek(day);
    
    return workSchedule.weeks[weekNum][weekDay];
  };

  // Check if a date is a holiday
  const checkIsHoliday = (day: Date, holidays: Holiday[]): boolean => {
    return holidays.some(holiday => format(day, "yyyy-MM-dd") === holiday.date);
  };

  // Get the name of a holiday for a specific date
  const getHolidayName = (day: Date, holidays: Holiday[]): string | null => {
    const holiday = holidays.find(h => format(day, "yyyy-MM-dd") === h.date);
    return holiday ? holiday.name : null;
  };

  // Calculate day status for styling and tooltip information
  const getDayStatus = (day: Date, workSchedule?: WorkSchedule, holidays: Holiday[] = []): DayStatus => {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const dayHoliday = checkIsHoliday(day, holidays);
    const holidayName = getHolidayName(day, holidays);
    const isRDO = workSchedule ? 
      workSchedule.rdoDays[getFortnightWeek(day)].includes(getWeekDayFromDate(day)) : 
      false;
    const workHours = getWorkHoursForDay(day, workSchedule);
    const isWorkDay = isWorkingDay(day, workSchedule);
    
    return {
      isWeekend,
      dayHoliday,
      holidayName,
      isRDO,
      workHours,
      isWorkDay
    };
  };

  return {
    getWeekDayFromDate,
    getFortnightWeek,
    isWorkingDay,
    getWorkHoursForDay,
    checkIsHoliday,
    getHolidayName,
    getDayStatus
  };
};
