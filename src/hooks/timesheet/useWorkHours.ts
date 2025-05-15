import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useTimesheetWorkHours } from './useTimesheetWorkHours';
import { useTimeCalculations } from './useTimeCalculations';
import { validateTimeOrder } from '@/utils/time/validation';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WorkHoursData, BreakConfig } from '@/contexts/timesheet/types';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { TimeEntry, WorkSchedule } from '@/types';
import { calculateHoursVariance, isUndertime } from '@/utils/time/calculations/timeCalculations';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';
import { useToast } from '@/hooks/use-toast';

/**
 * Comprehensive hook for work hours management
 * 
 * This is the main hook for working with work hours in the application.
 * It combines all functionality from different specialized hooks into one unified API.
 * 
 * @param options - Optional configuration object
 * @returns Combined work hours functionality
 */

const logger = createTimeLogger('useWorkHours');

// Define the options interface for the hook
export interface UseWorkHoursOptions {
  userId?: string;
  date?: Date;
  entries?: TimeEntry[];
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  formHandlers?: UseTimeEntryFormReturn[];
  onHoursChange?: (hours: number) => void;
}

export const useWorkHours = (options: UseWorkHoursOptions = {}) => {
  // Extract options with defaults
  const {
    userId,
    date,
    entries = [],
    workSchedule,
    interactive = true,
    formHandlers = [],
    onHoursChange
  } = options;

  const { toast } = useToast();

  // Use the enhanced implementation for core functionality
  const {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours
  } = useTimesheetWorkHours(userId);
  
  // Use our centralized calculation hook
  const { calculateHours } = useTimeCalculations();

  // State for tracking times
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [isProcessingSave, setIsProcessingSave] = useState(false);
  
  // Action states for leave, TOIL, etc.
  const [actionStates, setActionStates] = useState({
    leave: false,
    sick: false,
    toil: false,
    lunch: false,
    smoko: false
  });
  
  // Load work hours when date or userId changes
  useEffect(() => {
    if (!date || !userId) return;
    
    logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
    const { startTime: loadedStart, endTime: loadedEnd } = getWorkHoursForDate(date, userId);
    
    setStartTime(loadedStart || "");
    setEndTime(loadedEnd || "");
    
    // Calculate hours if both times are present
    if (loadedStart && loadedEnd) {
      try {
        const hours = calculateHours(loadedStart, loadedEnd);
        setCalculatedHours(hours);
      } catch (error) {
        logger.error("Error calculating hours:", error);
        setCalculatedHours(0);
      }
    } else {
      setCalculatedHours(0);
    }
  }, [date, userId, getWorkHoursForDate, calculateHours]);

  // Recalculate hours when times change
  useEffect(() => {
    // Only calculate if both times are set
    if (startTime && endTime) {
      try {
        const hours = calculateHours(startTime, endTime);
        setCalculatedHours(hours);
        
        // Update any existing form handlers with the new times
        if (interactive) {
          formHandlers.forEach(handler => {
            if (handler) {
              handler.updateTimes(startTime, endTime);
              handler.setHoursFromTimes();
            }
          });
        }
        
        // Call onHoursChange if provided
        if (onHoursChange) {
          onHoursChange(hours);
        }
      } catch (error) {
        logger.error("Error calculating hours:", error);
        setCalculatedHours(0);
      }
    } else {
      setCalculatedHours(0);
    }
  }, [startTime, endTime, formHandlers, interactive, onHoursChange, calculateHours]);
  
  // Handle time input changes with better validation and saving logic
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Time change: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive || !userId || !date || isProcessingSave) {
      return;
    }

    try {
      // Process the new time value first
      const currentStartTime = type === 'start' ? value : startTime;
      const currentEndTime = type === 'end' ? value : endTime;
      
      // Update the local state immediately to reflect user input
      if (type === 'start') {
        setStartTime(value);
      } else {
        setEndTime(value);
      }
      
      // Skip validation if one of the times is empty - we need both to validate
      if (!currentStartTime || !currentEndTime) {
        // We still want to save the partial state
        setIsProcessingSave(true);
        
        // Save the updated times to persist the partial state
        saveWorkHoursForDate(date, currentStartTime, currentEndTime, userId);
        
        logger.debug(`Saved partial time state: ${type} = ${value}`);
        
        // Notify about the change
        timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
          date: format(date, 'yyyy-MM-dd'),
          userId,
          startTime: currentStartTime,
          endTime: currentEndTime,
          timestamp: Date.now()
        });
        
        setIsProcessingSave(false);
        return;
      }

      // If we have both times, validate the time order
      const validation = validateTimeOrder(currentStartTime, currentEndTime);
      
      // Even if validation fails, we still save the values with a warning
      if (!validation.valid) {
        logger.warn(`Saving invalid time range: ${validation.message}`);
        
        toast({
          title: "Time Order Warning",
          description: validation.message,
          variant: "warning"
        });
      }
      
      // Save the updated times regardless of validation outcome
      // This allows users to save intermediate states, even if imperfect
      setIsProcessingSave(true);
      saveWorkHoursForDate(date, currentStartTime, currentEndTime, userId);
      
      logger.debug(`Saved times: ${currentStartTime} - ${currentEndTime}`);
      
      // Notify about the change
      timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
        date: format(date, 'yyyy-MM-dd'),
        userId,
        startTime: currentStartTime,
        endTime: currentEndTime,
        timestamp: Date.now()
      });
      
      setIsProcessingSave(false);
    } catch (error) {
      logger.error("Error updating time:", error);
      setIsProcessingSave(false);
      
      toast({
        title: "Error Updating Time",
        description: "There was a problem saving your time change. Please try again.",
        variant: "destructive"
      });
    }
  }, [startTime, endTime, interactive, date, userId, isProcessingSave, saveWorkHoursForDate, toast]);
  
  // Calculate day hours based on entries or schedule
  const calculateDayHours = useCallback((targetDate?: Date) => {
    const dateToUse = targetDate || date;
    
    if (!dateToUse) return 0;
    
    // If we have entries, use their total hours
    if (entries && entries.length > 0) {
      return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
    }
    
    // Otherwise, check if we have times to calculate from
    const hoursData = getWorkHoursForDate(dateToUse, userId);
    if (hoursData.startTime && hoursData.endTime) {
      try {
        return calculateHours(hoursData.startTime, hoursData.endTime);
      } catch (error) {
        logger.error(`Error calculating hours for ${format(dateToUse, 'yyyy-MM-dd')}:`, error);
        return 0;
      }
    }
    
    // Default to zero if we have no data
    return 0;
  }, [date, entries, userId, getWorkHoursForDate, calculateHours]);

  // Calculate auto hours from start and end times
  const calculateAutoHours = useCallback((startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    try {
      return calculateHours(startTime, endTime);
    } catch (error) {
      logger.error(`Error calculating hours: ${error}`);
      return 0;
    }
  }, [calculateHours]);

  // Check if custom hours exist for a date
  const hasCustomHours = useCallback((date: Date, targetUserId?: string): boolean => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return false;
    
    const hours = getWorkHoursForDate(date, effectiveUserId);
    return !!hours.startTime && !!hours.endTime && !!hours.hasData;
  }, [getWorkHoursForDate, userId]);
  
  // Reset work hours for a specific date
  const resetWorkHours = useCallback((date: Date, targetUserId?: string): void => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return;
    
    resetWorkHoursForDate(date, effectiveUserId);
  }, [resetWorkHoursForDate, userId]);
  
  // Clear all work hours (for compatibility)
  const clearAllWorkHours = useCallback((targetUserId?: string): void => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return;
    
    logger.debug('clearAllWorkHours called - operation replaced with refreshWorkHours');
    refreshWorkHours(undefined, effectiveUserId);
  }, [refreshWorkHours, userId]);
  
  // Toggle action states like leave, sick, TOIL
  const handleToggleAction = useCallback((type: string, scheduledHours: number): void => {
    setActionStates(prev => {
      const newStates = { ...prev };
      
      // Special handling for leave and sick which are mutually exclusive
      if (type === 'leave' || type === 'sick') {
        newStates.leave = type === 'leave' ? !prev.leave : false;
        newStates.sick = type === 'sick' ? !prev.sick : false;
        newStates.toil = false; // Turn off TOIL if leave/sick is enabled
      } 
      // Special handling for TOIL
      else if (type === 'toil') {
        newStates.toil = !prev.toil;
        newStates.leave = false; // Turn off leave if TOIL is enabled
        newStates.sick = false;  // Turn off sick if TOIL is enabled
      }
      // Handle breaks
      else {
        newStates[type] = !prev[type];
      }
      
      return newStates;
    });
    
    // Notify about action state changes
    if (date && userId) {
      timeEventsService.publish(WORK_HOURS_EVENTS.ACTION_TOGGLED, {
        date: format(date, 'yyyy-MM-dd'),
        userId,
        actionType: type,
        scheduledHours,
        timestamp: Date.now()
      });
    }
  }, [date, userId]);

  // Calculate work hours statistics from entries
  const getWorkHoursStats = useCallback(() => {
    if (!entries || entries.length === 0) {
      return {
        totalEnteredHours: 0,
        hasEntries: false,
        hoursVariance: 0,
        isUndertime: false
      };
    }

    // Total hours from all entries
    const totalEnteredHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    
    // Calculate target hours (ideally from schedule, default to 8)
    const targetHours = 8; // Default - in a real implementation this would come from schedule
    
    return {
      totalEnteredHours,
      hasEntries: entries.length > 0,
      hoursVariance: calculateHoursVariance(totalEnteredHours, targetHours),
      isUndertime: isUndertime(totalEnteredHours, targetHours)
    };
  }, [entries]);

  // Combine stats from entries
  const { totalEnteredHours, hasEntries, hoursVariance, isUndertime: isUndertimeValue } = getWorkHoursStats();

  // Add a wrapper method for test compatibility
  const getWorkHoursForDateWithCalculated = useCallback((date: Date, targetUserId?: string) => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) {
      return { startTime: "", endTime: "", calculatedHours: 0, isCustom: false, hasData: false };
    }
    
    const hours = getWorkHoursForDate(date, effectiveUserId);
    const calculatedHours = (hours.startTime && hours.endTime) 
      ? calculateAutoHours(hours.startTime, hours.endTime) 
      : 0;
      
    return {
      ...hours,
      calculatedHours,
      isCustom: !!hours.hasData
    };
  }, [getWorkHoursForDate, calculateAutoHours, userId]);

  // Return the combined API
  return {
    // Basic state
    startTime,
    endTime,
    calculatedHours,
    
    // Time entry states
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime: isUndertimeValue,
    
    // Action states
    actionStates,
    
    // Handlers
    handleTimeChange,
    handleToggleAction,
    
    // Core work hours API
    getWorkHoursForDate: getWorkHoursForDateWithCalculated,
    saveWorkHoursForDate,
    resetWorkHours,
    refreshWorkHours,
    
    // Calculation methods
    calculateAutoHours,
    calculateDayHours,
    
    // Utils
    hasCustomHours,
    clearAllWorkHours
  };
};

export default useWorkHours;
