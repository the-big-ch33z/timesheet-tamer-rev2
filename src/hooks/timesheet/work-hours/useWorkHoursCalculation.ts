import { useCallback, useEffect } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useTimeCalculations } from '../useTimeCalculations';
import { UseWorkHoursOptions } from '../types/workHoursTypes';

const logger = createTimeLogger('useWorkHoursCalculation');

/**
 * Hook for work hours calculations
 * Handles hours calculation from times and entries
 */
export const useWorkHoursCalculation = (
  startTime: string,
  endTime: string,
  options: UseWorkHoursOptions = {},
  setCalculatedHours: (hours: number) => void,
  formHandlers = []
) => {
  const { interactive = true, onHoursChange, entries = [] } = options;
  
  // Use our centralized calculation hook
  const { calculateHours } = useTimeCalculations();

  // Recalculate hours when times change
  useEffect(() => {
    // Only calculate if both times are set
    if (startTime && endTime) {
      try {
        const hours = calculateHours(startTime, endTime);
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
        
        // Call onHoursChange if provided
        if (onHoursChange) {
          onHoursChange(hours);
        }
      } catch (error) {
        logger.error("Error calculating hours:", error);
        setCalculatedHours(0);
      }
    } else {
      setCalculatedHours(0);
    }
  }, [startTime, endTime, formHandlers, interactive, onHoursChange, calculateHours, setCalculatedHours]);

  // Calculate day hours based on entries or schedule
  const calculateDayHours = useCallback((targetDate?: Date) => {
    const dateToUse = targetDate || options.date;
    
    if (!dateToUse) return 0;
    
    // If we have entries, use their total hours
    if (entries && entries.length > 0) {
      return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
    }
    
    // Otherwise, check if we have times to calculate from
    const hoursData = options.getWorkHoursForDate?.(dateToUse, options.userId);
    if (hoursData?.startTime && hoursData?.endTime) {
      try {
        return calculateHours(hoursData.startTime, hoursData.endTime);
      } catch (error) {
        logger.error(`Error calculating hours:`, error);
        return 0;
      }
    }
    
    // Default to zero if we have no data
    return 0;
  }, [options.date, entries, options.userId, options.getWorkHoursForDate, calculateHours]);

  // Calculate auto hours from start and end times
  const calculateAutoHours = useCallback((startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    try {
      return calculateHours(startTime, endTime);
    } catch (error) {
      logger.error(`Error calculating hours: ${error}`);
      return 0;
    }
  }, [calculateHours]);

  return {
    calculateDayHours,
    calculateAutoHours
  };
};
