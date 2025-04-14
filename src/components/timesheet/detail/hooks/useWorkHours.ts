
import { useState, useEffect, useCallback } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { validateTimeOrder } from "@/utils/time/validation";
import { useWorkHoursContext } from "@/contexts/timesheet/work-hours-context/WorkHoursContext";

interface UseWorkHoursProps {
  initialStartTime?: string;
  initialEndTime?: string;
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  date: Date;
  userId: string;
}

export const useWorkHours = ({
  initialStartTime = "09:00",
  initialEndTime = "17:00",
  formHandlers,
  interactive,
  date,
  userId
}: UseWorkHoursProps) => {
  const { toast } = useToast();
  const { getWorkHours, saveWorkHours } = useWorkHoursContext();
  
  // State for times
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [calculatedHours, setCalculatedHours] = useState(8.0);
  
  // Load saved work hours for this date and user
  useEffect(() => {
    if (userId && date) {
      console.log(`[useWorkHours] Loading work hours for ${userId} on ${date.toISOString().split('T')[0]}`);
      const savedHours = getWorkHours(date, userId);
      
      // Only use saved hours if they exist and differ from initial values
      if (savedHours) {
        console.log(`[useWorkHours] Found saved work hours: ${savedHours.startTime} - ${savedHours.endTime}`);
        setStartTime(savedHours.startTime);
        setEndTime(savedHours.endTime);
        const hours = calculateHoursFromTimes(savedHours.startTime, savedHours.endTime);
        setCalculatedHours(hours);
        return;
      }
    }
    
    // Fall back to initial values if no saved hours found
    console.log(`[useWorkHours] Using initial times: ${initialStartTime} - ${initialEndTime}`);
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    const hours = calculateHoursFromTimes(initialStartTime, initialEndTime);
    setCalculatedHours(hours);
  }, [date, userId, initialStartTime, initialEndTime, getWorkHours]);
  
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
