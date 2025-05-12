
import { format } from 'date-fns';
import { WorkHoursData } from '../types';
import { WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';
import { getDayScheduleInfo } from '@/utils/time/scheduleUtils';
import { useWorkSchedule } from '@/contexts/work-schedule';

const logger = createTimeLogger('WorkHoursOperations');

export const createWorkHoursOperations = (
  defaultSchedule: WorkSchedule,
  schedules: WorkSchedule[],
  getUserSchedule: (userId: string) => string
) => {
  // Store the last time we refreshed schedule data
  let lastScheduleRefreshTime = Date.now();

  const getDefaultHoursFromSchedule = (date: Date, userId: string): { startTime: string; endTime: string } => {
    try {
      // Always get the latest schedule ID for the user
      const userScheduleId = getUserSchedule(userId);
      let selectedSchedule: WorkSchedule;
      
      // Use latest schedule data
      if (userScheduleId === 'default') {
        selectedSchedule = defaultSchedule;
        logger.debug(`Using default schedule for user ${userId}`);
      } else {
        const foundSchedule = schedules.find(s => s.id === userScheduleId);
        if (foundSchedule) {
          selectedSchedule = foundSchedule;
          logger.debug(`Using custom schedule ${foundSchedule.name} for user ${userId}`);
        } else {
          selectedSchedule = defaultSchedule;
          logger.warn(`Schedule ${userScheduleId} not found for user ${userId}, falling back to default`);
        }
      }
      
      // Update last refresh time
      lastScheduleRefreshTime = Date.now();
      
      const daySchedule = getDayScheduleInfo(date, selectedSchedule);
      
      if (daySchedule && daySchedule.isWorkingDay && daySchedule.hours) {
        logger.debug(`Derived hours for ${userId} on ${format(date, 'yyyy-MM-dd')} from schedule: ${daySchedule.hours.startTime}-${daySchedule.hours.endTime}`);
        return {
          startTime: daySchedule.hours.startTime,
          endTime: daySchedule.hours.endTime
        };
      }
      
      logger.debug(`No schedule hours found for ${userId} on ${format(date, 'yyyy-MM-dd')}, using defaults`);
      return { startTime: "09:00", endTime: "17:00" };
    } catch (error) {
      logger.error(`Error getting default hours from schedule: ${error}`);
      return { startTime: "09:00", endTime: "17:00" };
    }
  };

  const getLastRefreshTime = () => lastScheduleRefreshTime;

  return { 
    getDefaultHoursFromSchedule,
    getLastRefreshTime 
  };
};
