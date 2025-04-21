import { useCallback } from 'react';
import { calculateHoursFromTimes } from '@/utils/time/calculations/timeCalculations';

// Define Timeout type to match NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

export const useTimeCalculation = ({
  startTime,
  endTime,
  processBatchedChanges,
  batchedChangesRef,
  batchTimeoutRef
}: {
  startTime: string;
  endTime: string;
  processBatchedChanges: () => void;
  batchedChangesRef: React.MutableRefObject<Record<string, string>>;
  batchTimeoutRef: React.MutableRefObject<Timeout | null>;
}) => {
  // Helper to update both times at once and trigger calculations
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.debug(`[useTimeCalculation] Updating times: ${newStartTime} - ${newEndTime}`);
    
    // Store changes
    batchedChangesRef.current['startTime'] = newStartTime;
    batchedChangesRef.current['endTime'] = newEndTime;
    
    // Clear any existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Apply changes immediately
    processBatchedChanges();
  }, [processBatchedChanges, batchedChangesRef, batchTimeoutRef]);
  
  // Calculate hours directly from current times
  const setHoursFromTimes = useCallback(() => {
    console.debug(`[useTimeCalculation] Calculating hours from times: ${startTime} - ${endTime}`);
    
    if (!startTime || !endTime) {
      console.debug('[useTimeCalculation] Missing start or end time, skipping calculation');
      return;
    }
    
    try {
      const hours = calculateHoursFromTimes(startTime, endTime);
      console.debug(`[useTimeCalculation] Calculated hours: ${hours}`);
      
      batchedChangesRef.current['hours'] = hours.toString();
      
      // Apply changes immediately
      processBatchedChanges();
    } catch (err) {
      console.error('[useTimeCalculation] Error calculating hours:', err);
    }
  }, [startTime, endTime, processBatchedChanges, batchedChangesRef]);
  
  return {
    updateTimes,
    setHoursFromTimes
  };
};
