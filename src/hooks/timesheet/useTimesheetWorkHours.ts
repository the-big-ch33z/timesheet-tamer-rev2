import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { safeTimeOperation } from '@/utils/time/errors/timeErrorHandling';
import { calculateHoursFromTimes } from '@/utils/time/calculations/hoursCalculations';
import { TimesheetWorkHoursHook, WorkHoursData } from './types/timeEntryTypes';

const logger = createTimeLogger('useTimesheetWorkHours');

/**
 * Enhanced hook for working with timesheet work hours
 * Provides methods for getting, saving, and managing work hours with robust error handling
 */
export const useTimesheetWorkHours = (userId?: string): TimesheetWorkHoursHook & { userId?: string } => {
  const context = useWorkHoursContext();
  
  // Keep track of last applied times for smart updates
  const lastAppliedTimesRef = useRef<Record<string, { startTime: string; endTime: string }>>({});
  
  // Get work hours for a specific date with enhanced error handling
  const getWorkHoursForDate = useCallback((date: Date, specificUserId?: string): WorkHoursData => {
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
      
      // Create a cache key for this date/user
      const cacheKey = `${targetUserId}-${format(date, 'yyyy-MM-dd')}`;
      
      // Update cache with current values for future comparisons
      lastAppliedTimesRef.current[cacheKey] = {
        startTime: result.startTime,
        endTime: result.endTime
      };
      
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
      
      // Create a cache key for this date/user
      const cacheKey = `${targetUserId}-${format(date, 'yyyy-MM-dd')}`;
      
      // Check for no actual changes
      const cached = lastAppliedTimesRef.current[cacheKey];
      if (cached && cached.startTime === startTime && cached.endTime === endTime) {
        logger.debug(`No changes to work hours, skipping save operation`);
        return true; // No changes needed, but not an error
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
      
      // Update the cache
      lastAppliedTimesRef.current[cacheKey] = { startTime, endTime };
      
      // Save to context
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
      
      // Create a cache key for this date/user
      const cacheKey = `${targetUserId}-${format(date, 'yyyy-MM-dd')}`;
      
      // Clear the cache entry
      delete lastAppliedTimesRef.current[cacheKey];
      
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
      
      // Clear all cache entries for this user
      const userPrefix = `${targetUserId}-`;
      Object.keys(lastAppliedTimesRef.current).forEach(key => {
        if (key.startsWith(userPrefix)) {
          delete lastAppliedTimesRef.current[key];
        }
      });
      
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
  
  // Force refresh of all cached work hours data
  const refreshWorkHours = useCallback(() => {
    logger.debug('Refreshing work hours cache');
    // Clear the entire cache to force re-fetching
    lastAppliedTimesRef.current = {};
  }, []);
  
  // Add userId to the returned object for tracking in useRef
  return {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    hasCustomHours,
    resetWorkHours,
    clearAllWorkHours,
    calculateDayHours,
    refreshWorkHours,
    userId
  };
};
