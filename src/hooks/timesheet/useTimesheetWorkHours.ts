
import { useCallback } from 'react';
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { toDate } from '@/utils/date/dateConversions';

const logger = createTimeLogger('useTimesheetWorkHours');

export const useTimesheetWorkHours = (defaultUserId?: string) => {
  const workHoursContext = useWorkHoursContext();

  const ensureDate = (date: Date | string): Date => {
    if (typeof date === 'string') {
      const convertedDate = toDate(date);
      if (!convertedDate) {
        throw new Error(`Invalid date string: ${date}`);
      }
      return convertedDate;
    }
    return date;
  };

  const formatDateForStorage = (date: Date | string): string => {
    const dateObj = ensureDate(date);
    return format(dateObj, 'yyyy-MM-dd');
  };

  const getWorkHoursForDate = useCallback((date: Date | string, userId?: string): { startTime: string, endTime: string, hasData?: boolean } => {
    const targetUserId = userId || defaultUserId || '';
    const dateObj = ensureDate(date);
    const formattedDate = format(dateObj, 'yyyy-MM-dd');

    if (!targetUserId) {
      logger.warn('No userId provided for getWorkHoursForDate');
      return { startTime: '', endTime: '', hasData: false };
    }

    const hours = workHoursContext.getWorkHours(dateObj, targetUserId);
    logger.debug(`Retrieved work hours for ${formattedDate}, user ${targetUserId}:`, hours);

    return {
      ...hours,
      hasData: !!(hours.startTime && hours.endTime)
    };
  }, [workHoursContext, defaultUserId]);

  const saveWorkHoursForDate = useCallback((date: Date | string, startTime: string, endTime: string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const dateObj = ensureDate(date);
    const formattedDate = format(dateObj, 'yyyy-MM-dd');

    if (!targetUserId) {
      logger.warn('No userId provided for saveWorkHoursForDate');
      return;
    }

    logger.debug(`Saving work hours for ${formattedDate}, user ${targetUserId}:`, { startTime, endTime });
    workHoursContext.saveWorkHours(dateObj, targetUserId, startTime, endTime);

    timeEventsService.publish('work-hours-updated', {
      date: formattedDate,
      userId: targetUserId,
      startTime,
      endTime,
      timestamp: Date.now()
    });
  }, [workHoursContext, defaultUserId]);

  const resetWorkHoursForDate = useCallback((date: Date | string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const dateObj = ensureDate(date);
    const formattedDate = format(dateObj, 'yyyy-MM-dd');

    if (!targetUserId) {
      logger.warn('No userId provided for resetWorkHoursForDate');
      return;
    }

    logger.debug(`Resetting work hours for ${formattedDate}, user ${targetUserId}`);
    workHoursContext.resetDayWorkHours(dateObj, targetUserId);
    const newHours = workHoursContext.getWorkHours(dateObj, targetUserId);

    timeEventsService.publish('work-hours-reset', {
      date: formattedDate,
      userId: targetUserId,
      startTime: newHours.startTime,
      endTime: newHours.endTime,
      timestamp: Date.now()
    });
  }, [workHoursContext, defaultUserId]);

  const refreshWorkHours = useCallback((date?: Date | string, userId?: string): void => {
    const targetUserId = userId || defaultUserId || '';
    const dateObj = date ? ensureDate(date) : new Date();
    const formattedDate = format(dateObj, 'yyyy-MM-dd');

    logger.debug(`Refreshing work hours from context for ${formattedDate}, user ${targetUserId}`);
    workHoursContext.refreshTimesForDate(dateObj, targetUserId);
  }, [workHoursContext, defaultUserId]);

  return {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours
  };
};

export default useTimesheetWorkHours;
