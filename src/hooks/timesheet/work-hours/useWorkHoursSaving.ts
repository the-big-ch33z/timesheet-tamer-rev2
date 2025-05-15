
import { useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { validateTimeOrder } from '@/utils/time/validation';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const logger = createTimeLogger('useWorkHoursSaving');

/**
 * Hook for work hours saving functionality
 * Handles time change events and validation with optimized performance
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
  
  // Use a ref to track the last saved values to avoid unnecessary saves
  const lastSavedRef = useRef({ startTime, endTime });

  // Debounce the actual save operation to reduce localStorage writes
  const debounceSave = useDebounce((currentStartTime: string, currentEndTime: string) => {
    if (!userId || !date || !interactive) {
      logger.debug('Skipping debounced save - missing required data');
      return;
    }
    
    try {
      logger.debug(`About to save times: start=${currentStartTime}, end=${currentEndTime}`);
      
      // Only save if values actually changed
      if (lastSavedRef.current.startTime === currentStartTime && 
          lastSavedRef.current.endTime === currentEndTime) {
        logger.debug('Skipping save - values unchanged');
        setIsProcessingSave(false);
        return;
      }
      
      // Save the updated times
      saveWorkHoursForDate(date, currentStartTime, currentEndTime, userId);
      
      // Update last saved values
      lastSavedRef.current = { startTime: currentStartTime, endTime: currentEndTime };
      
      // Only publish event if both values are set
      if (currentStartTime && currentEndTime) {
        // Notify about the change (optimized payload)
        timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
          date: format(date, 'yyyy-MM-dd'),
          userId,
          timestamp: Date.now()
        });
        
        // Show success toast only when both times are set
        toast({
          title: "Times Updated",
          description: `Work hours set to ${currentStartTime} - ${currentEndTime}`,
          duration: 2000
        });
        
        // If we have both times, validate the time order but don't block the save
        const validation = validateTimeOrder(currentStartTime, currentEndTime);
        
        // Show warning if validation fails
        if (!validation.valid) {
          logger.warn(`Saved invalid time range: ${validation.message}`);
          
          toast({
            title: "Time Order Warning",
            description: validation.message,
            variant: "default"
          });
        }
      }
      
      setIsProcessingSave(false);
    } catch (error) {
      logger.error("Error in debounced save:", error);
      setIsProcessingSave(false);
      
      toast({
        title: "Error Updating Time",
        description: "There was a problem saving your time change. Please try again.",
        variant: "destructive"
      });
    }
  }, 400);

  // Handle time input changes with optimized validation and saving logic
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    logger.debug(`Time change: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive || !userId || !date) {
      logger.debug(`Skipping time change - preconditions not met:`, { interactive, userId, date });
      return;
    }

    // Don't set processing state if already processing (prevents UI flickering)
    if (!isProcessingSave) {
      setIsProcessingSave(true);
    }
    
    try {
      // Update the local state immediately to reflect user input
      if (type === 'start') {
        setStartTime(value);
        debounceSave(value, endTime);
      } else {
        setEndTime(value);
        debounceSave(startTime, value);
      }
    } catch (error) {
      logger.error("Error updating time:", error);
      setIsProcessingSave(false);
      
      toast({
        title: "Error Updating Time",
        description: "There was a problem processing your time change.",
        variant: "destructive"
      });
    }
  }, [
    startTime, 
    endTime, 
    interactive, 
    date, 
    userId, 
    isProcessingSave, 
    setStartTime, 
    setEndTime, 
    setIsProcessingSave, 
    debounceSave
  ]);

  return {
    handleTimeChange
  };
};
