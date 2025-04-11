
import { getDaysInMonth, isWeekend } from "date-fns";

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
 * Calculates the target hours based on fortnight hours and work days in month
 */
export function calculateMonthlyTargetHours(fortnightHours: number, date: Date): number {
  const workDaysInMonth = getWorkdaysInMonth(date);
  const fortnightWorkDays = 10; // Typical workdays in a fortnight (2 weeks)
  
  // Calculate target hours proportionally
  const targetHours = (workDaysInMonth / fortnightWorkDays) * fortnightHours;
  
  // Round to 1 decimal place
  return Math.round(targetHours * 10) / 10;
}
