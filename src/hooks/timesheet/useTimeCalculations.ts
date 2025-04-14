
import { useCallback, useMemo } from 'react';
import { calculateHoursFromTimes } from '@/utils/time/calculations';
import { validateTimeOrder } from '@/utils/time/validation';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeCalculations');

/**
 * Custom hook for time-related calculations and validations
 */
export const useTimeCalculations = () => {
  // Calculate hours between two time strings
  const calculateHours = useCallback((startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    try {
      return calculateHoursFromTimes(startTime, endTime);
    } catch (error) {
      logger.error(`Error calculating hours: ${error}`);
      return 0;
    }
  }, []);
  
  // Validate time inputs
  const validateTimes = useCallback((startTime: string, endTime: string): { 
    valid: boolean; 
    message?: string;
  } => {
    if (!startTime || !endTime) {
      return { valid: true }; // Consider empty times as valid
    }
    
    return validateTimeOrder(startTime, endTime);
  }, []);
  
  // Format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTimeForDisplay = useCallback((time: string): string => {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':').map(part => parseInt(part, 10));
      if (isNaN(hours) || isNaN(minutes)) return time;
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      logger.error(`Error formatting time: ${error}`);
      return time;
    }
  }, []);
  
  return {
    calculateHours,
    validateTimes,
    formatTimeForDisplay
  };
};
