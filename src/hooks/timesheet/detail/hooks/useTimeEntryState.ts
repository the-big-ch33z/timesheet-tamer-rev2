import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHoursContext } from '@/contexts/timesheet';
import { calculateHoursFromTimes } from '@/utils/time/calculations/hoursCalculations';
import { calculateHoursVariance, isUndertime } from '@/utils/time/calculations/timeCalculations';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

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
 * Hook to manage time entry state
 * Handles start/end times, hours calculation, and state tracking
 * 
 * @param {TimeEntryStateOptions} options - Configuration options
 * @returns {Object} Time entry state and handlers
 */
export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  userId,
  onHoursChange
}: TimeEntryStateOptions) => {
  // Get work hours from context
  const workHoursContext = useWorkHoursContext();
  
  // For tracking schedule updates
  const scheduleUpdateCountRef = useRef(0);
  
  // Load work hours from context
  const loadWorkHours = useCallback(() => {
    // Get stored work hours for this date and user, handling both API versions
    let storedWorkHours: { startTime: string; endTime: string; isCustom?: boolean; hasData?: boolean };
    
    // Try the newer API first, fall back to older API if needed
    if (workHoursContext.getWorkHoursForDate) {
      storedWorkHours = workHoursContext.getWorkHoursForDate(date, userId);
    } else {
      // Fall back to the original getWorkHours method
      storedWorkHours = workHoursContext.getWorkHours(date, userId);
    }
    
    return storedWorkHours;
  }, [workHoursContext, date, userId]);
  
  // Initial stored work hours
  const initialWorkHours = loadWorkHours();
  
  // State for start and end times - use empty strings as defaults
  const [startTime, setStartTime] = useState(initialWorkHours?.startTime || '');
  const [endTime, setEndTime] = useState(initialWorkHours?.endTime || '');
  
  // Subscribe to schedule update events
  useEffect(() => {
    const scheduleUpdatedHandler = () => {
      logger.debug('Schedule updated, refreshing work hours');
      scheduleUpdateCountRef.current += 1;
      
      // Refresh work hours from context
      const refreshedHours = loadWorkHours();
      setStartTime(refreshedHours?.startTime || '');
      setEndTime(refreshedHours?.endTime || '');
    };
    
    const scheduleUpdatedUnsubscribe = timeEventsService.subscribe('schedules-updated', scheduleUpdatedHandler);
    const userScheduleUpdatedUnsubscribe = timeEventsService.subscribe('user-schedules-updated', scheduleUpdatedHandler);
    const scheduleChangedUnsubscribe = timeEventsService.subscribe('user-schedule-changed', scheduleUpdatedHandler);
    const workHoursRefreshUnsubscribe = timeEventsService.subscribe('schedules-updated', scheduleUpdatedHandler);
    
    return () => {
      scheduleUpdatedUnsubscribe.unsubscribe();
      userScheduleUpdatedUnsubscribe.unsubscribe();
      scheduleChangedUnsubscribe.unsubscribe();
      workHoursRefreshUnsubscribe.unsubscribe();
    };
  }, [loadWorkHours]);
  
  // Total hours from all entries
  const totalEnteredHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Calculate target hours for the day based on workSchedule
  const targetHours = 8; // Default to 8 hours if no schedule
  
  // Calculate hours variance
  const hoursVariance = calculateHoursVariance(totalEnteredHours, targetHours);
  
  // Check for undertime
  const isUndertimeValue = isUndertime(totalEnteredHours, targetHours);
  
  // Flag if we have entries
  const hasEntries = entries.length > 0;
  
  // Normalize a time value to ensure HH:MM format
  const normalizeTimeValue = useCallback((value: string): string => {
    if (!value) return "";
    
    // If already in HH:MM format, ensure hours are two digits
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const [hours, minutes] = value.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // If just a number, convert to HH:00 format
    if (/^\d{1,2}$/.test(value)) {
      return `${value.padStart(2, '0')}:00`;
    }
    
    return value;
  }, []);

  // Update start/end times and recalculate hours
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!interactive) return;
    
    const normalizedValue = normalizeTimeValue(value);

    try {
      if (type === 'start') {
        setStartTime(normalizedValue);
        // Use the appropriate save method based on what's available
        if (workHoursContext.saveWorkHoursForDate) {
          workHoursContext.saveWorkHoursForDate(date, normalizedValue, endTime, userId);
        } else {
          workHoursContext.saveWorkHours(date, userId, normalizedValue, endTime);
        }
      } else {
        setEndTime(normalizedValue);
        // Use the appropriate save method based on what's available
        if (workHoursContext.saveWorkHoursForDate) {
          workHoursContext.saveWorkHoursForDate(date, startTime, normalizedValue, userId);
        } else {
          workHoursContext.saveWorkHours(date, userId, startTime, normalizedValue);
        }
      }
      
      // Calculate hours if we have both start and end times
      if (startTime && endTime) {
        try {
          const calculatedHours = calculateHoursFromTimes(
            type === 'start' ? normalizedValue : startTime,
            type === 'end' ? normalizedValue : endTime
          );
          
          if (onHoursChange) {
            onHoursChange(calculatedHours);
          }
        } catch (err) {
          logger.error('Error calculating hours:', err);
        }
      }
    } catch (err) {
      logger.error(`Error handling time change for ${type}:`, err);
    }
  }, [startTime, endTime, interactive, date, userId, workHoursContext, onHoursChange, normalizeTimeValue]);
  
  // Initialize with stored values when date or userId changes
  useEffect(() => {
    const refreshedHours = loadWorkHours();
    if (refreshedHours) {
      setStartTime(refreshedHours.startTime || '');
      setEndTime(refreshedHours.endTime || '');
    }
  }, [date, userId, scheduleUpdateCountRef.current, loadWorkHours]);
  
  // Log for debugging
  useEffect(() => {
    logger.debug(`TimeEntryState initialized for date ${date.toISOString()}`, {
      startTime,
      endTime,
      hasEntries,
      entriesCount: entries.length
    });
  }, [date, entries.length, startTime, endTime, hasEntries]);

  return {
    startTime,
    endTime,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime: isUndertimeValue,
    handleTimeChange
  };
};
