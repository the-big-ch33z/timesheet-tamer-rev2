
import { defaultWorkSchedule } from "@/contexts/work-schedule";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";

// Calculate the default fortnight hours from the default schedule
const DEFAULT_FORTNIGHT_HOURS = calculateFortnightHoursFromSchedule(defaultWorkSchedule);

/**
 * Default user metric values
 */
export const USER_DEFAULTS = {
  // Default Full-Time Equivalent value (1.0 = full-time)
  FTE: 1.0,
  
  // Default fortnight hours calculated from default schedule
  FORTNIGHT_HOURS: DEFAULT_FORTNIGHT_HOURS || 80,
  
  // Default work schedule ID
  WORK_SCHEDULE_ID: 'default'
};

/**
 * Form placeholder values
 */
export const FORM_PLACEHOLDERS = {
  FTE: '1.0',
  FORTNIGHT_HOURS: '80'
};
