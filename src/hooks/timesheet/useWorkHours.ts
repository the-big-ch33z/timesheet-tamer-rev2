
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHours');

/**
 * Enhanced hook for working with work hours
 * Provides additional utility methods and better error handling
 */
export const useWorkHours = (userId?: string) => {
  const context = useWorkHoursContext();
  
  // Get work hours for a specific date with error handling
  const getWorkHoursForDate = useCallback((date: Date, specificUserId?: string): {
    startTime: string;
    endTime: string;
    isCustom: boolean;
    hasData: boolean;
  } => {
    try {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for getWorkHoursForDate');
        return { startTime: '', endTime: '', isCustom: false, hasData: false };
      }
      
      const result = context.getWorkHours(date, targetUserId);
      
      // Add a hasData flag for easier checking
      return {
        ...result,
        hasData: !!(result.startTime || result.endTime)
      };
    } catch (error) {
      logger.error('Error in getWorkHoursForDate:', error);
      return { startTime: '', endTime: '', isCustom: false, hasData: false };
    }
  }, [context, userId]);
  
  // Save work hours with validation
  const saveWorkHoursForDate = useCallback((
    date: Date, 
    startTime: string, 
    endTime: string, 
    specificUserId?: string
  ): boolean => {
    try {
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
      logger.debug(`Saved work hours for ${format(date, 'yyyy-MM-dd')}`);
      return true;
    } catch (error) {
      logger.error('Error in saveWorkHoursForDate:', error);
      return false;
    }
  }, [context, userId]);
  
  // Check if there are custom hours for a date
  const hasCustomHours = useCallback((date: Date, specificUserId?: string): boolean => {
    try {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        return false;
      }
      
      return context.hasCustomWorkHours(date, targetUserId);
    } catch (error) {
      logger.error('Error in hasCustomHours:', error);
      return false;
    }
  }, [context, userId]);
  
  // Reset work hours for a date
  const resetWorkHours = useCallback((date: Date, specificUserId?: string): void => {
    try {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for resetWorkHours');
        return;
      }
      
      context.resetDayWorkHours(date, targetUserId);
      logger.debug(`Reset work hours for ${format(date, 'yyyy-MM-dd')}`);
    } catch (error) {
      logger.error('Error in resetWorkHours:', error);
    }
  }, [context, userId]);
  
  // Clear all work hours for a user
  const clearAllWorkHours = useCallback((specificUserId?: string): void => {
    try {
      const targetUserId = specificUserId || userId;
      if (!targetUserId) {
        logger.warn('No user ID provided for clearAllWorkHours');
        return;
      }
      
      context.clearWorkHours(targetUserId);
      logger.debug(`Cleared all work hours for user ${targetUserId}`);
    } catch (error) {
      logger.error('Error in clearAllWorkHours:', error);
    }
  }, [context, userId]);
  
  return {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    hasCustomHours,
    resetWorkHours,
    clearAllWorkHours
  };
};
