
/**
 * Schedule utility functions
 * Functions for working with work schedules and calendar data
 */
import { WeekDay, WorkSchedule } from "@/types";
import { getDaysInMonth, isWeekend } from "date-fns";

// Helper function to get weekday from date
export const getWeekDay = (date: Date): WeekDay => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] as WeekDay;
};

// Helper function to determine fortnight week (1 or 2)
export const getFortnightWeek = (date: Date): 1 | 2 => {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weeksSinceYearStart = Math.floor(
    (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return ((weeksSinceYearStart % 2) + 1) as 1 | 2;
};

/**
 * Gets the number of workdays (Monday-Friday) in the given month
 */
export function getWorkdaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  
  let workdays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    // Count days that are not weekends
    if (!isWeekend(currentDate)) {
      workdays++;
    }
  }
  
  return workdays;
}

/**
 * Get schedule information for the selected day
 * @param date The date to check
 * @param workSchedule Work schedule to check against
 * @returns Schedule information for the day
 */
export const getDayScheduleInfo = (date: Date, workSchedule?: WorkSchedule) => {
  if (!workSchedule) return null;
  
  const weekDay = getWeekDay(date);
  const weekNum = getFortnightWeek(date);
  
  // Check if it's an RDO
  const isRDO = workSchedule.rdoDays[weekNum].includes(weekDay);
  
  if (isRDO) {
    return { 
      isWorkingDay: false, 
      isRDO: true, 
      hours: null 
    };
  }
  
  // Get scheduled work hours for this day
  const scheduledHours = workSchedule.weeks[weekNum][weekDay];
  
  return {
    isWorkingDay: !!scheduledHours,
    isRDO: false,
    hours: scheduledHours
  };
};

/**
 * Check if a day is a working day according to the schedule
 * @param day The day to check
 * @param workSchedule The work schedule
 * @returns True if it's a working day
 */
export const isWorkingDay = (day: Date, workSchedule?: WorkSchedule): boolean => {
  if (!workSchedule) return true; // Default to working day if no schedule

  const weekDay = getWeekDay(day);
  const weekNum = getFortnightWeek(day);
  
  // Check if it's an RDO
  if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
    return false;
  }
  
  // Check if there are work hours defined for this day
  const hoursForDay = workSchedule.weeks[weekNum][weekDay];
  return hoursForDay !== null;
};

/**
 * Calculate total hours for a fortnight based on the work schedule
 * @param workSchedule The work schedule
 * @returns Total hours in the fortnight
 */
export const calculateFortnightHoursFromSchedule = (workSchedule: WorkSchedule): number => {
  let totalHours = 0;
  
  // Process both weeks in the fortnight
  [1, 2].forEach(weekNum => {
    const weekNumKey = weekNum as 1 | 2;
    const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Calculate hours for each day of the week
    weekDays.forEach(day => {
      const daySchedule = workSchedule.weeks[weekNumKey][day];
      
      // Skip if no hours scheduled for this day or if it's an RDO
      if (!daySchedule || workSchedule.rdoDays[weekNumKey].includes(day)) return;
      
      // Calculate hours based on start and end time
      const startHour = parseInt(daySchedule.startTime.split(':')[0]);
      const startMinute = parseInt(daySchedule.startTime.split(':')[1]);
      
      const endHour = parseInt(daySchedule.endTime.split(':')[0]);
      const endMinute = parseInt(daySchedule.endTime.split(':')[1]);
      
      // Calculate total hours including partial hours
      const hours = endHour - startHour + (endMinute - startMinute) / 60;
      totalHours += hours;
    });
  });
  
  // Round to nearest 0.5
  return Math.round(totalHours * 2) / 2;
};
