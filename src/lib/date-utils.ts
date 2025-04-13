
/**
 * Date utility functions
 */
import { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';
import { calculateMonthlyTargetHours as calculateMonthlyTarget } from '@/utils/time/calculations';

/**
 * Calculates the target hours based on fortnight hours and work days in month
 * @deprecated Use calculateMonthlyTargetHours from @/utils/time/calculations instead
 */
export function calculateMonthlyTargetHours(fortnightHours: number, date: Date): number {
  return calculateMonthlyTarget(fortnightHours, date);
}

// Re-export the workdays function for backward compatibility
export { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';
