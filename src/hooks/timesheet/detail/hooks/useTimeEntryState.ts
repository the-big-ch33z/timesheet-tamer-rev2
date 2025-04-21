
import { useState, useEffect, useCallback } from "react";
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
  
  // State for time values and hours
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
  
  // Subscribe to time entry events
  useEffect(() => {
    const handleTimeEvent = () => {
      logger.debug('[useTimeEntryState] Time event detected, refreshing state');
      refreshWorkHours();
      
      const { startTime: updatedStart, endTime: updatedEnd } = getWorkHoursForDate(date, userId);
      
      setStartTime(updatedStart);
      setEndTime(updatedEnd);
      
      if (updatedStart && updatedEnd) {
        try {
          const hours = calculateHoursFromTimes(updatedStart, updatedEnd);
          setScheduledHours(hours);
        } catch (error) {
          logger.error('Error calculating hours:', error);
        }
      }
    };
    
    // Fix: properly store and call unsubscribe methods from subscription objects
    const subscriptions = [
      timeEventsService.subscribe('entry-created', handleTimeEvent),
      timeEventsService.subscribe('entry-updated', handleTimeEvent),
      timeEventsService.subscribe('entry-deleted', handleTimeEvent),
      timeEventsService.subscribe('hours-updated', handleTimeEvent)
    ];
    
    return () => {
      // Fix: Properly access the unsubscribe method on each subscription
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [date, userId, refreshWorkHours, getWorkHoursForDate]);
  
  // Update times and scheduled hours when date changes
  useEffect(() => {
    if (date && userId) {
      logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
      
      const { startTime: loadedStart, endTime: loadedEnd } = getWorkHoursForDate(date, userId);
      
      setStartTime(loadedStart);
      setEndTime(loadedEnd);
      
      if (loadedStart && loadedEnd) {
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
    }
  }, [date, userId, getWorkHoursForDate, onHoursChange]);
  
  // Handle time input changes
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!interactive) return;
    
    logger.debug(`Time change: ${type} = ${value}`);
    
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
    if (type === 'start') setStartTime(value);
    else setEndTime(value);
    
    saveWorkHoursForDate(date, newStartTime, newEndTime, userId);
    
    if (newStartTime && newEndTime) {
      try {
        const hours = calculateHoursFromTimes(newStartTime, newEndTime);
        setScheduledHours(hours);
        
        // Call onHoursChange if it exists
        if (onHoursChange) {
          onHoursChange(hours);
        }
      } catch (error) {
        logger.error('Error calculating hours:', error);
      }
    }
    
    timeEventsService.publish('hours-updated', {
      type,
      value,
      date: date.toISOString(),
      userId
    });
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate, onHoursChange]);
  
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
