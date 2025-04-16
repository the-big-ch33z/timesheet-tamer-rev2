
import { useState, useEffect, useCallback } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { validateTimeOrder } from "@/utils/time/validation";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";

interface UseWorkHoursProps {
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  date: Date;
  userId: string;
}

export const useWorkHours = ({
  formHandlers,
  interactive,
  date,
  userId
}: UseWorkHoursProps) => {
  const { toast } = useToast();
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours();
  
  // State for times
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calculatedHours, setCalculatedHours] = useState(0);
  
  // Load work hours when date or userId changes
  useEffect(() => {
    if (!date || !userId) return;
    
    console.log(`[useWorkHours] Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
    const { startTime: loadedStart, endTime: loadedEnd } = getWorkHoursForDate(date, userId);
    
    setStartTime(loadedStart || "");
    setEndTime(loadedEnd || "");
    
    // Calculate hours if both times are present
    if (loadedStart && loadedEnd) {
      try {
        const hours = calculateHoursFromTimes(loadedStart, loadedEnd);
        setCalculatedHours(hours);
        console.log(`[useWorkHours] Calculated ${hours} hours from ${loadedStart} to ${loadedEnd}`);
      } catch (error) {
        console.error("[useWorkHours] Error calculating hours:", error);
        setCalculatedHours(0);
      }
    } else {
      setCalculatedHours(0);
    }
  }, [date, userId, getWorkHoursForDate]);
  
  // Handle time input changes with better validation and saving logic
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    console.log(`[useWorkHours] Time change: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive) {
      console.log("[useWorkHours] Not in interactive mode, ignoring time change");
      return;
    }
    
    try {
      // Make sure we have valid values to work with
      const currentStartTime = type === 'start' ? value : startTime;
      const currentEndTime = type === 'end' ? value : endTime;
      
      // Only validate if both times are set
      if (currentStartTime && currentEndTime) {
        // Validate the time order
        const validation = validateTimeOrder(currentStartTime, currentEndTime);
        
        if (!validation.valid) {
          toast({
            title: "Invalid time range",
            description: validation.message || "Please check your time inputs",
            variant: "destructive"
          });
          return;
        }
      }
      
      // If validation passes or one of the times is empty, update the times
      if (type === 'start') {
        console.log(`[useWorkHours] Setting start time from ${startTime} to ${value}`);
        setStartTime(value);
      } else {
        console.log(`[useWorkHours] Setting end time from ${endTime} to ${value}`);
        setEndTime(value);
      }
      
      // Save the updated times - only if userId and date are provided
      if (userId && date) {
        console.log(`[useWorkHours] Saving work hours for ${userId} on ${date.toDateString()}`);
        
        // If one of the times is empty, save what we have
        const timeToSave = {
          startTime: type === 'start' ? value : startTime,
          endTime: type === 'end' ? value : endTime
        };
        
        console.log(`[useWorkHours] Saving times: ${timeToSave.startTime} - ${timeToSave.endTime}`);
        saveWorkHoursForDate(date, timeToSave.startTime, timeToSave.endTime, userId);
      } else {
        console.warn(`[useWorkHours] Cannot save work hours - missing userId (${userId}) or date (${date})`);
      }
    } catch (error) {
      console.error("[useWorkHours] Error updating time:", error);
      toast({
        title: "Error updating time",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [startTime, endTime, interactive, toast, date, userId, saveWorkHoursForDate]);
  
  // Recalculate hours when times change
  useEffect(() => {
    // Only calculate if both times are set
    if (startTime && endTime) {
      console.log(`[useWorkHours] Time change detected: ${startTime} to ${endTime}`);
      try {
        const hours = calculateHoursFromTimes(startTime, endTime);
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
      } catch (error) {
        console.error("[useWorkHours] Error calculating hours:", error);
        setCalculatedHours(0);
      }
    } else {
      // If either time is not set, calculated hours is 0
      setCalculatedHours(0);
    }
  }, [startTime, endTime, formHandlers, interactive]);

  return {
    startTime,
    endTime,
    calculatedHours,
    handleTimeChange
  };
};
