
import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { validateTimeOrder } from "@/utils/time/validation";
import { useWorkHoursContext } from "@/contexts/timesheet/work-hours-context/WorkHoursContext";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";
import { WorkSchedule } from "@/types";

interface UseWorkHoursProps {
  initialStartTime?: string;
  initialEndTime?: string;
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  date: Date;
  userId: string;
  workSchedule?: WorkSchedule;
}

export const useWorkHours = ({
  initialStartTime,
  initialEndTime,
  formHandlers,
  interactive,
  date,
  userId,
  workSchedule
}: UseWorkHoursProps) => {
  const { toast } = useToast();
  const { getWorkHours, saveWorkHours, hasCustomWorkHours } = useWorkHoursContext();
  
  // State for times
  const [startTime, setStartTime] = useState(initialStartTime || "");
  const [endTime, setEndTime] = useState(initialEndTime || "");
  const [calculatedHours, setCalculatedHours] = useState(0);
  
  // Flag to track if we're currently making a manual time change
  // This prevents the useEffect from overriding our manual changes
  const manualChangeRef = useRef(false);
  
  // Track if we've already initialized the times for this date/user
  const initializedRef = useRef(false);
  
  // Memoized date string for dependency comparison
  const dateString = date ? date.toISOString().split('T')[0] : '';
  
  // Get times with proper precedence:
  // 1. Custom saved times from localStorage (user overrides)
  // 2. Schedule-based times (only if we have schedule and it's a workday)
  // 3. Empty values (new approach - no defaults)
  useEffect(() => {
    // Skip this effect if we're currently making a manual change
    if (manualChangeRef.current) {
      console.log("[useWorkHours] Manual change in progress, skipping automatic update");
      return;
    }
    
    // Skip this effect if we've already initialized for this date/user
    // This prevents the values from being reset when other state changes
    if (initializedRef.current && userId && date) {
      console.log("[useWorkHours] Already initialized for this date/user, skipping");
      return;
    }
    
    if (!userId || !date) {
      console.log("[useWorkHours] No userId or date, using empty values");
      setStartTime("");
      setEndTime("");
      return;
    }

    // Check if we have custom saved hours for this day
    if (hasCustomWorkHours(date, userId)) {
      console.log(`[useWorkHours] Using custom saved hours for ${userId} on ${dateString}`);
      const savedHours = getWorkHours(date, userId);
      
      setStartTime(savedHours.startTime);
      setEndTime(savedHours.endTime);
    } 
    // If no custom hours, check the work schedule
    else if (workSchedule) {
      console.log(`[useWorkHours] No custom hours, checking work schedule for ${dateString}`);
      const scheduleInfo = getDayScheduleInfo(date, workSchedule);
      
      if (scheduleInfo?.hours && scheduleInfo.isWorkDay) {
        console.log(`[useWorkHours] Using schedule hours: ${scheduleInfo.hours.startTime} - ${scheduleInfo.hours.endTime}`);
        setStartTime(scheduleInfo.hours.startTime);
        setEndTime(scheduleInfo.hours.endTime);
      } else {
        // Use empty values if schedule doesn't have hours for this day or it's not a workday
        console.log(`[useWorkHours] Not a scheduled work day, using empty values`);
        setStartTime("");
        setEndTime("");
      }
    } 
    // No custom hours or schedule - use empty values
    else {
      console.log(`[useWorkHours] Using empty values as no saved times or schedule exists`);
      setStartTime("");
      setEndTime("");
    }
    
    // Mark as initialized for this date/user combination
    initializedRef.current = true;
    
  }, [dateString, userId, workSchedule, getWorkHours, hasCustomWorkHours]);
  
  // Reset the initialized flag when date or userId changes
  useEffect(() => {
    initializedRef.current = false;
  }, [date, userId]);
  
  // Handle time input changes with better validation
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    console.log(`[useWorkHours] Time change: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive) {
      console.log("[useWorkHours] Not in interactive mode, ignoring time change");
      return;
    }
    
    try {
      // Set the manual change flag to prevent the useEffect from overriding this change
      manualChangeRef.current = true;
      
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
      
      // Save the updated times - only if both times are provided
      if (userId && date && (
        (type === 'start' && value && endTime) || 
        (type === 'end' && value && startTime)
      )) {
        console.log(`[useWorkHours] Saving work hours for ${userId} on ${dateString}`);
        saveWorkHours(
          date,
          userId,
          type === 'start' ? value : startTime,
          type === 'end' ? value : endTime
        );
      }
      
      // Clear the manual change flag after a short delay to ensure the save completes
      // before any other effects that might try to reload the values
      setTimeout(() => {
        manualChangeRef.current = false;
      }, 300);
    } catch (error) {
      console.error("[useWorkHours] Error updating time:", error);
      toast({
        title: "Error updating time",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      // Ensure we reset the manual change flag even if there's an error
      manualChangeRef.current = false;
    }
  }, [startTime, endTime, interactive, toast, date, userId, saveWorkHours, dateString]);
  
  // Recalculate hours when times change
  useEffect(() => {
    // Only calculate if both times are set
    if (startTime && endTime) {
      console.log(`[useWorkHours] Time change detected: ${startTime} to ${endTime}`);
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
