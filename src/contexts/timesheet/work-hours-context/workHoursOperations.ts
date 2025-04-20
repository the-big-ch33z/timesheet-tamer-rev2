
import { format } from 'date-fns';
import { WorkHoursData } from './types';
import { WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';
import { getDayScheduleInfo } from '@/utils/time/scheduleUtils';

const logger = createTimeLogger('WorkHoursOperations');

export const createWorkHoursOperations = (
  defaultSchedule: WorkSchedule,
  schedules: WorkSchedule[],
  getUserSchedule: (userId: string) => string
) => {
  const getDefaultHoursFromSchedule = (date: Date, userId: string): { startTime: string; endTime: string } => {
    try {
      const userScheduleId = getUserSchedule(userId);
      let selectedSchedule: WorkSchedule;
      
      if (userScheduleId === 'default') {
        selectedSchedule = defaultSchedule;
      } else {
        const foundSchedule = schedules.find(s => s.id === userScheduleId);
        selectedSchedule = foundSchedule || defaultSchedule;
      }
      
      const daySchedule = getDayScheduleInfo(date, selectedSchedule);
      
      if (daySchedule && daySchedule.isWorkingDay && daySchedule.hours) {
        logger.debug(`Derived default hours for ${userId} on ${format(date, 'yyyy-MM-dd')} from schedule: ${daySchedule.hours.startTime}-${daySchedule.hours.endTime}`);
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

  return { getDefaultHoursFromSchedule };
};

