
import { useMemo } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations/timeCalculations";

export const useHoursCalculation = (
  startTime: string, 
  endTime: string, 
  breakAdjustments: number, 
  scheduledHours: number,
  effectiveHours: number,
  hasEntries: boolean
) => {
  // Helper function to round to quarter hour
  const roundToQuarter = (val: number) => Math.round(val * 4) / 4;
  
  // Calculate the raw hours from start/end times plus adjustments for breaks
  const calculatedTimeHours = useMemo(() => {
    try {
      if (!startTime || !endTime) return 0;
      
      // Use properly imported function
      const rawHours = calculateHoursFromTimes(startTime, endTime);
      
      // Apply break adjustments
      const adjustedHours = Math.max(0, roundToQuarter(rawHours + breakAdjustments));
      
      return adjustedHours;
    } catch (error) {
      console.error("Error calculating time hours:", error);
      return 0;
    }
  }, [startTime, endTime, breakAdjustments]);

  // Check if the day is complete based on hours
  const isComplete = useMemo(() => {
    if (!hasEntries && (!startTime || !endTime)) return false;
    
    const targetHours = scheduledHours;
    const actualHours = hasEntries ? effectiveHours : calculatedTimeHours;
    const variance = Math.abs(roundToQuarter(actualHours) - targetHours);
    
    return variance <= 0.01;
  }, [calculatedTimeHours, scheduledHours, hasEntries, startTime, endTime, effectiveHours]);

  // Check if hours exceed scheduled hours
  const isOverScheduled = effectiveHours > scheduledHours + 0.01;

  return {
    calculatedTimeHours,
    isComplete,
    isOverScheduled,
    roundToQuarter
  };
};
