
/**
 * Time calculations
 * This file is kept for backward compatibility
 * New code should import from @/utils/time/calculations
 */

// Re-export specific utility functions to avoid ambiguous exports
export { 
  calculateHoursFromTimes,
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours,
  calculateFortnightHoursFromSchedule
} from '@/utils/time/calculations/hoursCalculations';

export { 
  calculateHoursVariance,
  isUndertime,
  safeCalculateVariance
} from '@/utils/time/calculations/varianceCalculations';

export * from '@/utils/time/formatting/timeFormatting';
