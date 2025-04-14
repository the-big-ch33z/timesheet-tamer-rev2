
/**
 * Date utility functions
 */
import { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';
import { calculateMonthlyTargetHours as calculateMonthlyTarget } from '@/utils/time/calculations';
import { formatDate, formatDateForDisplay } from '@/utils/time/formatting';
import { isValidDate, ensureDate, areSameDates } from '@/utils/time/validation';

/**
 * Calculates the target hours based on fortnight hours and work days in month
 * @deprecated Use calculateMonthlyTargetHours from @/utils/time/calculations instead
 */
export function calculateMonthlyTargetHours(fortnightHours: number, date: Date): number {
  return calculateMonthlyTarget(fortnightHours, date);
}

/**
 * Safely parse a date string
 * @param dateStr Date string to parse
 * @returns Valid Date object or null
 */
export function parseDate(dateStr: string): Date | null {
  return ensureDate(dateStr);
}

/**
 * Safe date comparison
 * @param dateA First date
 * @param dateB Second date
 * @returns Boolean indicating if dates are the same day
 */
export function datesAreEqual(dateA: Date | string | null, dateB: Date | string | null): boolean {
  return areSameDates(dateA, dateB);
}

// Re-export the workdays function for backward compatibility
export { getWorkdaysInMonth } from '@/utils/time/scheduleUtils';

// Re-export utility functions for easy access
export { formatDate, formatDateForDisplay, isValidDate, ensureDate };
