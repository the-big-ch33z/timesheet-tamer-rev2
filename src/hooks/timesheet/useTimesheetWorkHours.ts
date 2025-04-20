import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { safeTimeOperation } from '@/utils/time/errors/timeErrorHandling';
import { calculateHoursFromTimes } from '@/utils/time/calculations/hoursCalculations';
import { TimesheetWorkHoursHook, WorkHoursData } from './types/timeEntryTypes';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('useTimesheetWorkHours');

/**
 * Enhanced hook for working with timesheet work hours
 * Provides methods for getting, saving, and managing work hours with robust error handling
 * Integrates with WorkScheduleContext to derive defaults and respond to schedule changes
 */
export const useTimesheetWorkHours = (userId?: string): TimesheetWorkHoursHook & { userId?: string } => {
  const context = useWorkHoursContext();
  const workSchedule = useWorkSchedule();
  
  // Keep track of last applied times for smart updates
  const lastAppliedTimesRef = useRef<Record<string, { startTime: string; endTime: string }>>({});
  
  // Listen for schedule change events that might affect our work hours
  useEffect(() => {
    const handleScheduleChange = (data: any) => {
      if (data.userId === userId || !data.userId) {
        logger.debug('Schedule change detected, refreshing work hours cache');
        refreshWorkHours();
      }
    };
    
    // Subscribe to relevant events
    const scheduleSubscription = timeEventsService.subscribe('user-schedule-changed', handleScheduleChange);
    const schedulesSubscription = timeEventsService.subscribe('schedules-updated', handleScheduleChange);
    
    return () => {
      scheduleSubscription.unsubscribe();
      schedulesSubscription.unsubscribe();
    };
  }, [userId]);
  
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
      
      logger.debug(`Retrieved work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}, hasData: ${hasData}, isCustom: ${result.isCustom}`);
      
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
    });
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
      
      // Save to context - which will now check against schedule defaults
      context.saveWorkHours(date, targetUserId, startTime, endTime);
      logger.debug(`Saved work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}`);
      
      // Publish event that hours have been updated
      timeEventsService.publish('work-hours-updated', {
        date: format(date, 'yyyy-MM-dd'),
        userId: targetUserId,
        startTime,
        endTime,
        timestamp: Date.now()
      });
      
      return true;
    }, false);
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
    }, false);
  }, [context, userId]);
  
  // Reset work hours for a date to defaults from schedule
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
      
      // Reset to schedule default
      context.resetDayWorkHours(date, targetUserId);
      logger.debug(`Reset work hours for ${format(date, 'yyyy-MM-dd')}, userId: ${targetUserId}`);
      
      // Publish event that hours have been reset
      timeEventsService.publish('work-hours-reset', {
        date: format(date, 'yyyy-MM-dd'),
        userId: targetUserId,
        timestamp: Date.now()
      });
    }, undefined);
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
      
      // Publish event that all hours have been cleared
      timeEventsService.publish('work-hours-cleared', {
        userId: targetUserId,
        timestamp: Date.now()
      });
    }, undefined);
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
    }, 0);
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
