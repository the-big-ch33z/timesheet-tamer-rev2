
import { useMemo } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations/hoursCalculations";

/**
 * Options for the useHoursCalculation hook
 */
export interface HoursCalculationOptions {
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Adjustments for breaks in hours */
  breakAdjustments: number;
  /** Scheduled hours for the day */
  scheduledHours: number;
  /** Effective hours (from entries) */
  effectiveHours: number;
  /** Whether there are entries for the day */
  hasEntries: boolean;
}

/**
 * Hook to calculate hours based on times and adjustments
 * 
 * Calculates raw hours from start/end times, applies adjustments,
 * and determines if the day is complete based on scheduled hours.
 * 
 * @param {HoursCalculationOptions} options - Calculation options
 * @returns {Object} Calculated hours and completion status
 */
export const useHoursCalculation = ({
  startTime, 
  endTime, 
  breakAdjustments, 
  scheduledHours,
  effectiveHours,
  hasEntries
}: HoursCalculationOptions) => {
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
    // If no entries or missing start/end times, it's not complete
    if (!hasEntries || (!startTime || !endTime)) return false;
    
    const targetHours = roundToQuarter(scheduledHours);
    const actualHours = hasEntries ? roundToQuarter(effectiveHours) : 0; // Use 0 if no entries
    
    // Use a tighter tolerance (0.01 hours = 36 seconds) to match calculation in completionUtils
    const variance = Math.abs(actualHours - targetHours);
    
    return variance <= 0.01;
  }, [scheduledHours, hasEntries, startTime, endTime, effectiveHours]);

  // Check if hours exceed scheduled hours - only relevant if there are entries
  const isOverScheduled = hasEntries && roundToQuarter(effectiveHours) > roundToQuarter(scheduledHours) + 0.01;

  return {
    calculatedTimeHours,
    isComplete,
    isOverScheduled,
    roundToQuarter
  };
};
