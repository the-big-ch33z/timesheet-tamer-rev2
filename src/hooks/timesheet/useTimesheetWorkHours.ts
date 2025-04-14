
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { safeTimeOperation } from '@/utils/time/errors/timeErrorHandling';
import { calculateHoursFromTimes } from '@/utils/time/calculations/hoursCalculations';

const logger = createTimeLogger('useTimesheetWorkHours');

/**
 * Enhanced hook for working with timesheet work hours
 * Provides methods for getting, saving, and managing work hours with robust error handling
 */
export const useTimesheetWorkHours = (userId?: string) => {
  const context = useWorkHoursContext();
  
  // Get work hours for a specific date with enhanced error handling
  const getWorkHoursForDate = useCallback((date: Date, specificUserId?: string): {
    startTime: string;
    endTime: string;
    isCustom: boolean;
    hasData: boolean;
    calculatedHours: number;
  } => {
    return safeTimeOperation(() => {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for getWorkHoursForDate');
        return { 
          startTime: '', 
          endTime: '', 
          isCustom: false, 
          hasData: false,
          calculatedHours: 0
        };
      }
      
      const result = context.getWorkHours(date, targetUserId);
      const hasData = !!(result.startTime || result.endTime);
      
      // Calculate hours if both start and end times exist
      let calculatedHours = 0;
      if (result.startTime && result.endTime) {
        try {
          calculatedHours = calculateHoursFromTimes(result.startTime, result.endTime);
        } catch (error) {
          logger.error(`Error calculating hours: ${error}`);
        }
      }
      
      logger.debug(`Retrieved work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}, hasData: ${hasData}`);
      
      return {
        ...result,
        hasData,
        calculatedHours
      };
    }, { 
      startTime: '', 
      endTime: '', 
      isCustom: false, 
      hasData: false,
      calculatedHours: 0
    }, `Get work hours for ${format(date, 'yyyy-MM-dd')}`);
  }, [context, userId]);
  
  // Save work hours with enhanced validation and error handling
  const saveWorkHoursForDate = useCallback((
    date: Date, 
    startTime: string, 
    endTime: string, 
    specificUserId?: string
  ): boolean => {
    return safeTimeOperation(() => {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for saveWorkHoursForDate');
        return false;
      }
      
      // Basic validation
      if (startTime && !startTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        logger.warn(`Invalid start time format: ${startTime}`);
        return false;
      }
      
      if (endTime && !endTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        logger.warn(`Invalid end time format: ${endTime}`);
        return false;
      }
      
      context.saveWorkHours(date, targetUserId, startTime, endTime);
      logger.debug(`Saved work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}`);
      return true;
    }, false, `Save work hours for ${format(date, 'yyyy-MM-dd')}`);
  }, [context, userId]);
  
  // Check if there are custom hours for a date
  const hasCustomHours = useCallback((date: Date, specificUserId?: string): boolean => {
    return safeTimeOperation(() => {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        return false;
      }
      
      const hasCustom = context.hasCustomWorkHours(date, targetUserId);
      logger.debug(`Checked custom hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}, result: ${hasCustom}`);
      return hasCustom;
    }, false, `Check custom hours for ${format(date, 'yyyy-MM-dd')}`);
  }, [context, userId]);
  
  // Reset work hours for a date to defaults
  const resetWorkHours = useCallback((date: Date, specificUserId?: string): void => {
    safeTimeOperation(() => {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for resetWorkHours');
        return;
      }
      
      context.resetDayWorkHours(date, targetUserId);
      logger.debug(`Reset work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}`);
    }, undefined, `Reset work hours for ${format(date, 'yyyy-MM-dd')}`);
  }, [context, userId]);
  
  // Clear all work hours for a user
  const clearAllWorkHours = useCallback((specificUserId?: string): void => {
    safeTimeOperation(() => {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for clearAllWorkHours');
        return;
      }
      
      context.clearWorkHours(targetUserId);
      logger.debug(`Cleared all work hours for user ${targetUserId}`);
    }, undefined, 'Clear all work hours');
  }, [context, userId]);
  
  // Calculate hours for a day based on stored work hours
  const calculateDayHours = useCallback((date: Date, specificUserId?: string): number => {
    return safeTimeOperation(() => {
      const { startTime, endTime } = getWorkHoursForDate(date, specificUserId || userId);
      
      if (startTime && endTime) {
        try {
          return calculateHoursFromTimes(startTime, endTime);
        } catch (error) {
          logger.error(`Error calculating hours: ${error}`);
          return 0;
        }
      }
      
      return 0;
    }, 0, `Calculate day hours for ${format(date, 'yyyy-MM-dd')}`);
  }, [getWorkHoursForDate, userId]);
  
  return {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    hasCustomHours,
    resetWorkHours,
    clearAllWorkHours,
    calculateDayHours
  };
};
