
import { useCallback } from 'react';
import { format } from 'date-fns';
import { validateTimeOrder } from '@/utils/time/validation';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { useToast } from '@/hooks/use-toast';

const logger = createTimeLogger('useWorkHoursSaving');

/**
 * Hook for work hours saving functionality
 * Handles time change events and validation
 */
export const useWorkHoursSaving = (
  startTime: string,
  endTime: string,
  options: UseWorkHoursOptions = {},
  setStartTime: (time: string) => void,
  setEndTime: (time: string) => void,
  isProcessingSave: boolean,
  setIsProcessingSave: (processing: boolean) => void,
  saveWorkHoursForDate: (date: Date, startTime: string, endTime: string, userId?: string) => void
) => {
  const { date, userId, interactive = true } = options;
  const { toast } = useToast();

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
          variant: "default" // Changed from "warning" to "default"
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
  }, [startTime, endTime, interactive, date, userId, isProcessingSave, saveWorkHoursForDate, setStartTime, setEndTime, setIsProcessingSave, toast]);

  return {
    handleTimeChange
  };
};
