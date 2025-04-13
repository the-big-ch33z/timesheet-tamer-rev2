
import { useState, useEffect, useCallback } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { validateTimeOrder } from "@/utils/time/validation";

interface UseWorkHoursProps {
  initialStartTime?: string;
  initialEndTime?: string;
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
}

export const useWorkHours = ({
  initialStartTime = "09:00",
  initialEndTime = "17:00",
  formHandlers,
  interactive
}: UseWorkHoursProps) => {
  const { toast } = useToast();
  
  // State for times
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [calculatedHours, setCalculatedHours] = useState(8.0);
  
  // Initialize with provided times
  useEffect(() => {
    console.log(`Initializing useWorkHours with times: ${initialStartTime} to ${initialEndTime}`);
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    const hours = calculateHoursFromTimes(initialStartTime, initialEndTime);
    setCalculatedHours(hours);
  }, [initialStartTime, initialEndTime]);
  
  // Handle time input changes with better validation
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    console.log(`WorkHoursSection time change: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive) {
      console.log("Not in interactive mode, ignoring time change");
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
        console.log(`Setting start time from ${startTime} to ${value}`);
        setStartTime(value);
      } else {
        console.log(`Setting end time from ${endTime} to ${value}`);
        setEndTime(value);
      }
    } catch (error) {
      console.error("Error updating time:", error);
      toast({
        title: "Error updating time",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [startTime, endTime, interactive, toast]);
  
  // Recalculate hours when times change
  useEffect(() => {
    console.log(`Time change detected in useWorkHours: ${startTime} to ${endTime}`);
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
