
import { useState, useEffect, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { calculateHoursFromTimes } from "@/utils/time/calculations";
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
}

/**
 * Hook to manage the state for time entries on a specific day
 */
export const useTimeEntryState = ({
  entries = [],
  date,
  workSchedule,
  interactive = true,
  userId
}: UseTimeEntryStateProps) => {
  // Get work hours handling from the consolidated hook
  const {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    refreshWorkHours
  } = useTimesheetWorkHours(userId);
  
  // Load initial work hours from the hook
  const { startTime: initialStart, endTime: initialEnd, calculatedHours: initialHours } = 
    getWorkHoursForDate(date, userId);
  
  // State for time values
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [calculatedHours, setCalculatedHours] = useState(initialHours);
  
  // Derived state
  const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);
  const hasEntries = entries.length > 0;
  const isComplete = hasEntries && Math.abs(totalHours - calculatedHours) < 0.1;
  const hoursVariance = calculatedHours - totalHours;
  const isUndertime = hoursVariance > 0.1;
  
  // Subscribe to time entry events
  useEffect(() => {
    const handleTimeEvent = () => {
      logger.debug('[useTimeEntryState] Time event detected, refreshing state');
      
      // Refresh from the data source
      refreshWorkHours();
      
      const { startTime: updatedStart, endTime: updatedEnd, calculatedHours: updatedHours } = 
        getWorkHoursForDate(date, userId);
      
      // Update local state
      setStartTime(updatedStart);
      setEndTime(updatedEnd);
      setCalculatedHours(updatedHours);
    };
    
    // Subscribe to relevant events
    const unsubCreate = timeEventsService.subscribe('entry-created', handleTimeEvent);
    const unsubUpdate = timeEventsService.subscribe('entry-updated', handleTimeEvent);
    const unsubDelete = timeEventsService.subscribe('entry-deleted', handleTimeEvent);
    const unsubHours = timeEventsService.subscribe('hours-updated', handleTimeEvent);
    
    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
      unsubHours();
    };
  }, [date, userId, refreshWorkHours, getWorkHoursForDate]);
  
  // Update times when date changes
  useEffect(() => {
    if (date && userId) {
      logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
      
      const { startTime: loadedStart, endTime: loadedEnd, calculatedHours: loadedHours } = 
        getWorkHoursForDate(date, userId);
      
      setStartTime(loadedStart);
      setEndTime(loadedEnd);
      setCalculatedHours(loadedHours);
    }
  }, [date, userId, getWorkHoursForDate]);
  
  // Handle time input changes
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!interactive) return;
    
    logger.debug(`Time change: ${type} = ${value}`);
    
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
    // Update local state
    if (type === 'start') setStartTime(value);
    else setEndTime(value);
    
    // Save changes to context
    saveWorkHoursForDate(date, newStartTime, newEndTime, userId);
    
    // Calculate hours if both times are present
    if (newStartTime && newEndTime) {
      try {
        const hours = calculateHoursFromTimes(newStartTime, newEndTime);
        setCalculatedHours(hours);
      } catch (error) {
        logger.error(`Error calculating hours: ${error}`);
      }
    } else {
      setCalculatedHours(0);
    }
    
    // Notify other components of the change
    timeEventsService.publish('hours-updated', {
      type,
      value,
      date: date.toISOString(),
      userId
    });
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate]);
  
  return {
    startTime,
    endTime,
    calculatedHours,
    totalHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    isComplete,
    handleTimeChange
  };
};
