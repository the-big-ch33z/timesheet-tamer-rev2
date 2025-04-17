
import { useEffect, useRef, useMemo } from 'react';

/**
 * Hook for tracking date changes for form submissions
 * with optimization to prevent unnecessary re-renders
 */
export const useDateTracking = (selectedDate: Date | null) => {
  // Use ref to track previous date to avoid unnecessary effects
  const prevDateRef = useRef<Date | null>(null);
  
  // Track when selectedDate changes
  useEffect(() => {
    // Compare date values instead of object references
    const dateChanged = selectedDate && 
      (!prevDateRef.current || 
       prevDateRef.current.getTime() !== selectedDate.getTime());
       
    if (dateChanged) {
      console.debug(`[useDateTracking] Selected date changed to: ${selectedDate.toISOString()}`);
      // Update the previous date reference
      prevDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isDateValid: !!selectedDate
  }), [selectedDate]);
};
