import { Holiday, WorkSchedule, WeekDay } from "@/types";
import { getWeekDay, getFortnightWeek } from "./scheduleUtils";
import { createTimeLogger } from "./errors";
import { isWeekend } from "date-fns";

const logger = createTimeLogger('rdoUtils');

/**
 * Check if a date is valid for RDO assignment
 */
export const isValidRDODay = (date: Date, holidays: Holiday[], workSchedule: WorkSchedule): boolean => {
  // Cannot be a weekend
  if (isWeekend(date)) return false;
  
  // Cannot be a holiday
  const isHoliday = holidays.some(holiday => holiday.date === date.toISOString().split('T')[0]);
  if (isHoliday) return false;
  
  // Must be a working day in the schedule
  const weekday = getWeekDay(date);
  const week = getFortnightWeek(date);
  const dayConfig = workSchedule.weeks[week][weekday];
  
  return !!dayConfig;
};

/**
 * Find the next available working day for an RDO
 */
export const findNextAvailableWorkday = (
  date: Date,
  holidays: Holiday[],
  workSchedule: WorkSchedule
): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Keep checking days until we find a valid one
  while (!isValidRDODay(nextDay, holidays, workSchedule)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

/**
 * Resolve any RDO conflicts with holidays in a schedule
 */
export const resolveRDOConflicts = (
  schedule: WorkSchedule,
  holidays: Holiday[]
): { 
  schedule: WorkSchedule; 
  movements: Array<{ 
    fromDate: string; 
    toDate: string; 
    weekNum: 1 | 2;
    fromDay: WeekDay;
    toDay: WeekDay;
  }>;
} => {
  const updatedSchedule = { ...schedule };
  const movements: Array<{
    fromDate: string;
    toDate: string;
    weekNum: 1 | 2;
    fromDay: WeekDay;
    toDay: WeekDay;
  }> = [];

  // Check each week's RDOs
  [1, 2].forEach(weekNum => {
    const rdoDays = [...updatedSchedule.rdoDays[weekNum as 1 | 2]];
    
    rdoDays.forEach((day, index) => {
      // Convert day name to a date for the current fortnight
      const currentDate = new Date(); // We'll use current date as reference
      while (getFortnightWeek(currentDate) !== weekNum) {
        currentDate.setDate(currentDate.getDate() + 7);
      }
      while (getWeekDay(currentDate) !== day) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Check if this RDO falls on a holiday
      const dateStr = currentDate.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => h.date === dateStr);
      
      if (isHoliday) {
        // Find next available day
        const newDate = findNextAvailableWorkday(currentDate, holidays, schedule);
        const newDay = getWeekDay(newDate);
        
        // Update the schedule
        rdoDays[index] = newDay;
        
        // Record the movement
        movements.push({
          fromDate: dateStr,
          toDate: newDate.toISOString().split('T')[0],
          weekNum: weekNum as 1 | 2,
          fromDay: day,
          toDay: newDay
        });
        
        logger.debug(`Moving RDO from ${day} to ${newDay} due to holiday conflict`);
      }
    });
    
    updatedSchedule.rdoDays[weekNum as 1 | 2] = rdoDays;
  });
  
  return { schedule: updatedSchedule, movements };
};
