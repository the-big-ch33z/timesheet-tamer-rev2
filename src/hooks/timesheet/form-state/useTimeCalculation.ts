import { useCallback } from 'react';
import { calculateHoursFromTimes } from '@/utils/time/calculations/hoursCalculations';

// Define Timeout type to match NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

// Helper to normalize time format to ensure HH:MM format
const normalizeTimeFormat = (timeString: string): string => {
  if (!timeString) return "";
  
  // If already in HH:MM format, return as is with padding
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // If just a number (like "9"), convert to HH:00 format
  if (/^\d{1,2}$/.test(timeString)) {
    return `${timeString.padStart(2, '0')}:00`;
  }
  
  return timeString;
};

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
    
    // Normalize time formats
    const normalizedStart = normalizeTimeFormat(newStartTime);
    const normalizedEnd = normalizeTimeFormat(newEndTime);
    
    // Store changes
    batchedChangesRef.current['startTime'] = normalizedStart;
    batchedChangesRef.current['endTime'] = normalizedEnd;
    
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
      // Normalize times before calculation
      const normalizedStart = normalizeTimeFormat(startTime);
      const normalizedEnd = normalizeTimeFormat(endTime);
      
      const hours = calculateHoursFromTimes(normalizedStart, normalizedEnd);
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
