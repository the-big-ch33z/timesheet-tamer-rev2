
import { useCallback } from 'react';
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { format, parse } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('useTimesheetWorkHours');

/**
 * Hook for interacting with work hours in a timesheet context
 */
export const useTimesheetWorkHours = (defaultUserId?: string) => {
  const workHoursContext = useWorkHoursContext();
  
  // Helper to ensure we have a Date object
  const ensureDate = (date: Date | string): Date => {
    if (typeof date === 'string') {
      return new Date(date);
    }
    return date;
  };
  
  // Helper to format date for storage
  const formatDateForStorage = (date: Date | string): string => {
    const dateObj = ensureDate(date);
    return format(dateObj, 'yyyy-MM-dd');
  };
  
  // Get work hours for a specific date
  const getWorkHoursForDate = useCallback((date: Date | string, userId?: string): { startTime: string, endTime: string, hasData?: boolean } => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = formatDateForStorage(date);
    
    if (!targetUserId) {
      logger.warn('No userId provided for getWorkHoursForDate');
      return { startTime: '', endTime: '', hasData: false };
    }
    
    const hours = workHoursContext.getWorkHours(targetUserId, formattedDate);
    logger.debug(`Retrieved work hours for ${formattedDate}, user ${targetUserId}:`, hours);
    
    // Add hasData property
    return {
      ...hours,
      hasData: !!(hours.startTime && hours.endTime)
    };
  }, [workHoursContext, defaultUserId]);
  
  // Save work hours for a specific date with immediate feedback
  const saveWorkHoursForDate = useCallback((date: Date | string, startTime: string, endTime: string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = formatDateForStorage(date);
    
    if (!targetUserId) {
      logger.warn('No userId provided for saveWorkHoursForDate');
      return;
    }
    
    logger.debug(`Saving work hours for ${formattedDate}, user ${targetUserId}:`, { startTime, endTime });
    
    // Save work hours in context
    workHoursContext.saveWorkHours(targetUserId, formattedDate, startTime, endTime);
    
    // Dispatch event to notify subscribers of the change
    timeEventsService.publish('work-hours-updated', {
      date: formattedDate,
      userId: targetUserId,
      startTime,
      endTime,
      timestamp: Date.now()
    });
  }, [workHoursContext, defaultUserId]);
  
  // Reset work hours to defaults based on schedule
  const resetWorkHoursForDate = useCallback((date: Date | string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = formatDateForStorage(date);
    
    if (!targetUserId) {
      logger.warn('No userId provided for resetWorkHoursForDate');
      return;
    }
    
    logger.debug(`Resetting work hours for ${formattedDate}, user ${targetUserId}`);
    
    // Reset work hours in context
    workHoursContext.resetDayWorkHours(targetUserId, formattedDate);
    
    // Get the new hours after reset
    const newHours = workHoursContext.getWorkHours(targetUserId, formattedDate);
    
    // Dispatch event to notify subscribers of the change
    timeEventsService.publish('work-hours-reset', {
      date: formattedDate,
      userId: targetUserId,
      startTime: newHours.startTime,
      endTime: newHours.endTime,
      timestamp: Date.now()
    });
  }, [workHoursContext, defaultUserId]);
  
  // Refresh work hours from storage/context
  const refreshWorkHours = useCallback((): void => {
    logger.debug('Refreshing work hours from context');
    workHoursContext.refreshTimesForDate();
  }, [workHoursContext]);
  
  return {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours
  };
};

export default useTimesheetWorkHours;
