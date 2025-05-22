
import { useCallback } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimeEntryState');

/**
 * Options for the useTimeEntryState hook
 */
export interface TimeEntryStateOptions {
  /** Time entries for the current day */
  entries: TimeEntry[];
  /** The current day */
  date: Date;
  /** The work schedule for the user */
  workSchedule?: WorkSchedule;
  /** Whether the interface is interactive */
  interactive: boolean;
  /** The user ID */
  userId: string;
  /** Callback when hours change */
  onHoursChange?: (hours: number) => void;
}

/**
 * Hook for managing time entry state
 * Uses the unified useWorkHours hook internally
 */
export const useTimeEntryState = (options: TimeEntryStateOptions) => {
  const {
    entries,
    date,
    workSchedule,
    interactive,
    userId,
    onHoursChange
  } = options;
  
  // Use the unified hook with all necessary options
  const {
    startTime,
    endTime,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    handleTimeChange
  } = useWorkHours({
    userId,
    date,
    entries,
    workSchedule,
    interactive,
    onHoursChange
  });
  
  return {
    startTime,
    endTime,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    handleTimeChange
  };
};

export default useTimeEntryState;
