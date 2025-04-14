
import { useState, useEffect, useCallback } from 'react';
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
  initialStartTime = "09:00",
  initialEndTime = "17:00",
  formHandlers,
  interactive,
  date,
  userId,
  workSchedule
}: UseWorkHoursProps) => {
  const { toast } = useToast();
  const { getWorkHours, saveWorkHours, hasCustomWorkHours } = useWorkHoursContext();
  
  // State for times
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [calculatedHours, setCalculatedHours] = useState(8.0);
  
  // Get times with proper precedence:
  // 1. Custom saved times from localStorage (user overrides)
  // 2. Schedule-based times
  // 3. Default times (fallback)
  useEffect(() => {
    if (!userId || !date) {
      console.log("[useWorkHours] No userId or date, using initial values");
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      return;
    }

    // Check if we have custom saved hours for this day
    if (hasCustomWorkHours(date, userId)) {
      console.log(`[useWorkHours] Using custom saved hours for ${userId} on ${date.toISOString().split('T')[0]}`);
      const savedHours = getWorkHours(date, userId);
      
      setStartTime(savedHours.startTime);
      setEndTime(savedHours.endTime);
    } 
    // If no custom hours, check the work schedule
    else if (workSchedule) {
      console.log(`[useWorkHours] No custom hours, checking work schedule for ${date.toISOString().split('T')[0]}`);
      const scheduleInfo = getDayScheduleInfo(date, workSchedule);
      
      if (scheduleInfo?.hours) {
        console.log(`[useWorkHours] Using schedule hours: ${scheduleInfo.hours.startTime} - ${scheduleInfo.hours.endTime}`);
        setStartTime(scheduleInfo.hours.startTime);
        setEndTime(scheduleInfo.hours.endTime);
      } else {
        // Fall back to defaults if schedule doesn't have hours for this day
        console.log(`[useWorkHours] No schedule hours for this day, using defaults`);
        setStartTime(initialStartTime);
        setEndTime(initialEndTime);
      }
    } 
    // No custom hours or schedule - use defaults
    else {
      console.log(`[useWorkHours] Using default hours: ${initialStartTime} - ${initialEndTime}`);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
    }
    
  }, [date, userId, initialStartTime, initialEndTime, getWorkHours, hasCustomWorkHours, workSchedule]);
  
  // Handle time input changes with better validation
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
      
      // If validation passes, update the times
      if (type === 'start') {
        console.log(`[useWorkHours] Setting start time from ${startTime} to ${value}`);
        setStartTime(value);
      } else {
        console.log(`[useWorkHours] Setting end time from ${endTime} to ${value}`);
        setEndTime(value);
      }
      
      // Save the updated times
      if (userId && date) {
        console.log(`[useWorkHours] Saving work hours for ${userId}`);
        saveWorkHours(
          date,
          userId,
          type === 'start' ? value : startTime,
          type === 'end' ? value : endTime
        );
      }
    } catch (error) {
      console.error("[useWorkHours] Error updating time:", error);
      toast({
        title: "Error updating time",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [startTime, endTime, interactive, toast, date, userId, saveWorkHours]);
  
  // Recalculate hours when times change
  useEffect(() => {
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
  }, [startTime, endTime, formHandlers, interactive]);

  return {
    startTime,
    endTime,
    calculatedHours,
    handleTimeChange
  };
};
