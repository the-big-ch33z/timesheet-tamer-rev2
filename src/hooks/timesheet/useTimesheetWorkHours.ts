
import { useCallback } from 'react';
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('useTimesheetWorkHours');

/**
 * Hook for interacting with work hours in a timesheet context
 */
export const useTimesheetWorkHours = (defaultUserId?: string) => {
  const workHoursContext = useWorkHoursContext();
  
  // Get work hours for a specific date
  const getWorkHoursForDate = useCallback((date: Date, userId?: string): { startTime: string, endTime: string } => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    if (!targetUserId) {
      logger.warn('No userId provided for getWorkHoursForDate');
      return { startTime: '', endTime: '' };
    }
    
    const hours = workHoursContext.getWorkHours(targetUserId, formattedDate);
    logger.debug(`Retrieved work hours for ${formattedDate}, user ${targetUserId}:`, hours);
    
    return hours;
  }, [workHoursContext, defaultUserId]);
  
  // Save work hours for a specific date with immediate feedback
  const saveWorkHoursForDate = useCallback((date: Date, startTime: string, endTime: string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = format(date, 'yyyy-MM-dd');
    
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
  const resetWorkHoursForDate = useCallback((date: Date, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const formattedDate = format(date, 'yyyy-MM-dd');
    
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
