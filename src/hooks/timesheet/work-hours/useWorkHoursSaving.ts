
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
      logger.debug(`Skipping time change - preconditions not met:`, { interactive, userId, date, isProcessingSave });
      return;
    }

    try {
      // Process the new time value first
      const currentStartTime = type === 'start' ? value : startTime;
      const currentEndTime = type === 'end' ? value : endTime;
      
      // Update the local state immediately to reflect user input
      if (type === 'start') {
        setStartTime(value);
        logger.debug(`Updated local start time state to: ${value}`);
      } else {
        setEndTime(value);
        logger.debug(`Updated local end time state to: ${value}`);
      }
      
      // Save the times regardless of validation to ensure user input is preserved
      setIsProcessingSave(true);
      
      // Log the values being saved to help with debugging
      logger.debug(`About to save times: start=${currentStartTime}, end=${currentEndTime}`);
      
      // Save the updated times
      saveWorkHoursForDate(date, currentStartTime, currentEndTime, userId);
      
      // Notify about the change
      timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
        date: format(date, 'yyyy-MM-dd'),
        userId,
        startTime: currentStartTime,
        endTime: currentEndTime,
        timestamp: Date.now()
      });
      
      // Show a success toast for better user feedback
      if (currentStartTime && currentEndTime) {
        toast({
          title: "Times Updated",
          description: `Work hours set to ${currentStartTime} - ${currentEndTime}`,
          duration: 2000
        });
      }
      
      setIsProcessingSave(false);
      
      // Optionally validate after saving if both times are present
      if (currentStartTime && currentEndTime) {
        // If we have both times, validate the time order
        const validation = validateTimeOrder(currentStartTime, currentEndTime);
        
        // Show warning if validation fails but don't block the save
        if (!validation.valid) {
          logger.warn(`Saved invalid time range: ${validation.message}`);
          
          toast({
            title: "Time Order Warning",
            description: validation.message,
            variant: "default"
          });
        }
      }
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
