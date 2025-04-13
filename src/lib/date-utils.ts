
/**
 * Date utility functions
 */
import { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';

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

// Re-export the workdays function for backward compatibility
export { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';
