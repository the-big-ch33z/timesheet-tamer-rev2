
import { useWorkSchedule as useWorkScheduleContext } from '@/contexts/work-schedule';

/**
 * Re-export the work schedule context hook for consistent importing patterns
 * This allows consumers to import from hooks/timesheet instead of directly from contexts
 */
export const useWorkSchedule = useWorkScheduleContext;
