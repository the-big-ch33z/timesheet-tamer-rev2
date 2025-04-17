
import { useCallback } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";

/**
 * Hook for handling time-related calculations and updates
 */
export const useTimeCalculation = ({
  startTime,
  endTime,
  processBatchedChanges,
  batchedChangesRef,
  batchTimeoutRef
}) => {
  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.debug(`[useTimeCalculation] Updating times: ${newStartTime} to ${newEndTime}`);
    
    // Add to batched changes
    batchedChangesRef.current['startTime'] = newStartTime;
    batchedChangesRef.current['endTime'] = newEndTime;
    
    // Clear any existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Process immediately
    processBatchedChanges();
  }, [processBatchedChanges, batchedChangesRef, batchTimeoutRef]);

  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.debug(`[useTimeCalculation] Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    
    // Add to batched changes
    batchedChangesRef.current['hours'] = calculatedHours.toFixed(1);
    
    // Clear any existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Process immediately
    processBatchedChanges();
    
    return calculatedHours;
  }, [startTime, endTime, processBatchedChanges, batchedChangesRef, batchTimeoutRef]);
  
  return {
    updateTimes,
    setHoursFromTimes
  };
};
