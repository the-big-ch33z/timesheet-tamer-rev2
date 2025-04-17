
import { useEffect } from 'react';

/**
 * Hook for tracking date changes for form submissions
 */
export const useDateTracking = (selectedDate: Date | null) => {
  // Track when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      console.debug(`[useDateTracking] Selected date changed to: ${selectedDate.toISOString()}`);
    }
  }, [selectedDate]);

  return {
    isDateValid: !!selectedDate
  };
};
