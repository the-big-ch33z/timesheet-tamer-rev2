
import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { calculateHoursFromTimes } from "@/utils/time/calculations/timeCalculations";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { createTimeLogger } from "@/utils/time/errors";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

const logger = createTimeLogger('useTimeEntryState');

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  userId: string;
  onHoursChange?: (hours: number) => void;
}

interface TimeEntryState {
  startTime: string;
  endTime: string;
  scheduledHours: number;
  totalEnteredHours: number;
  hasEntries: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  isComplete: boolean;
}

export const useTimeEntryState = ({
  entries = [],
  date,
  workSchedule,
  interactive = true,
  userId,
  onHoursChange
}: UseTimeEntryStateProps): TimeEntryState & {
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
} => {
  const {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    refreshWorkHours
  } = useTimesheetWorkHours(userId);
  
  // Get initial work hours
  const { startTime: initialStart, endTime: initialEnd } = getWorkHoursForDate(date, userId);
  
  // Use refs to track the latest state without re-renders
  const startTimeRef = useRef(initialStart);
  const endTimeRef = useRef(initialEnd);
  const isMounted = useRef(true);
  
  // State for time values and hours - these drive UI updates
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [scheduledHours, setScheduledHours] = useState(0);
  
  // Calculate total entered hours from entries
  const totalEnteredHours = entries.reduce((total, entry) => total + entry.hours, 0);
  const hasEntries = entries.length > 0;
  
  // Calculate hours variance and completion status
  const hoursVariance = scheduledHours - totalEnteredHours;
  const isUndertime = hoursVariance > 0.1;
  const isComplete = hasEntries && Math.abs(hoursVariance) < 0.1;
  
  // Update internal refs when state changes
  useEffect(() => {
    startTimeRef.current = startTime;
    endTimeRef.current = endTime;
  }, [startTime, endTime]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Subscribe to time entry events - with improved subscription handling
  useEffect(() => {
    logger.debug('Setting up event subscriptions for time entries');
    
    const unsubscribeFunctions = [];
    
    const handleTimeEvent = () => {
      if (!isMounted.current) return;
      
      logger.debug('[useTimeEntryState] Time event detected, refreshing state');
      refreshWorkHours();
      
      const { startTime: updatedStart, endTime: updatedEnd } = getWorkHoursForDate(date, userId);
      
      if (isMounted.current) {
        setStartTime(updatedStart);
        setEndTime(updatedEnd);
        startTimeRef.current = updatedStart;
        endTimeRef.current = updatedEnd;
      }
      
      if (updatedStart && updatedEnd && isMounted.current) {
        try {
          const hours = calculateHoursFromTimes(updatedStart, updatedEnd);
          setScheduledHours(hours);
          
          // Call onHoursChange if it exists
          if (onHoursChange) {
            onHoursChange(hours);
          }
        } catch (error) {
          logger.error('Error calculating hours:', error);
        }
      }
    };
    
    // Register all event listeners with proper cleanup
    const subscribers = [
      timeEventsService.subscribe('entry-created', handleTimeEvent),
      timeEventsService.subscribe('entry-updated', handleTimeEvent),
      timeEventsService.subscribe('entry-deleted', handleTimeEvent),
      timeEventsService.subscribe('hours-updated', handleTimeEvent)
    ];
    
    // Store unsubscribe functions
    subscribers.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        unsubscribeFunctions.push(() => sub.unsubscribe());
      }
    });
    
    // Return cleanup function that calls all unsubscribe functions
    return () => {
      logger.debug('Cleaning up time entry event subscriptions');
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [date, userId, refreshWorkHours, getWorkHoursForDate, onHoursChange]);
  
  // Update times and scheduled hours when date changes
  useEffect(() => {
    if (!date || !userId || !isMounted.current) return;
    
    logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
    
    const { startTime: loadedStart, endTime: loadedEnd } = getWorkHoursForDate(date, userId);
    
    if (isMounted.current) {
      setStartTime(loadedStart);
      setEndTime(loadedEnd);
      startTimeRef.current = loadedStart;
      endTimeRef.current = loadedEnd;
    }
    
    if (loadedStart && loadedEnd && isMounted.current) {
      try {
        const hours = calculateHoursFromTimes(loadedStart, loadedEnd);
        setScheduledHours(hours);
        
        // Call onHoursChange if it exists
        if (onHoursChange) {
          onHoursChange(hours);
        }
      } catch (error) {
        logger.error('Error calculating hours:', error);
      }
    }
  }, [date, userId, getWorkHoursForDate, onHoursChange]);
  
  // Handle time input changes with improved saving mechanism
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string): void => {
    if (!interactive || !isMounted.current) return;
    
    logger.debug(`Time change: ${type} = ${value}`);
    
    // Update local state immediately for UI feedback
    if (type === 'start') {
      setStartTime(value);
      startTimeRef.current = value;
    } else {
      setEndTime(value);
      endTimeRef.current = value;
    }
    
    // Immediately save the new time values
    const newStartTime = type === 'start' ? value : startTimeRef.current;
    const newEndTime = type === 'end' ? value : endTimeRef.current;
    
    // Save to work hours storage
    saveWorkHoursForDate(date, newStartTime, newEndTime, userId);
    
    // Calculate new hours if both times are present
    if (newStartTime && newEndTime) {
      try {
        const hours = calculateHoursFromTimes(newStartTime, newEndTime);
        setScheduledHours(hours);
        
        // Notify parent component of hours change
        if (onHoursChange) {
          onHoursChange(hours);
        }
      } catch (error) {
        logger.error('Error calculating hours:', error);
      }
    }
    
    // Publish event to notify other components
    timeEventsService.publish('hours-updated', {
      type,
      value,
      date: date.toISOString(),
      userId,
      startTime: newStartTime,
      endTime: newEndTime
    });
  }, [interactive, date, userId, saveWorkHoursForDate, onHoursChange]);
  
  return {
    startTime,
    endTime,
    scheduledHours,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    isComplete,
    handleTimeChange
  };
};
