
import { format } from 'date-fns';
import { WorkHoursData } from '../types';
import { WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';
import { getDayScheduleInfo } from '@/utils/time/scheduleUtils';

const logger = createTimeLogger('WorkHoursOperations');

/**
 * Creates work hours operations with the provided schedules
 * 
 * @param defaultSchedule Default work schedule to use as fallback
 * @param schedules Available work schedules
 * @param getUserSchedule Function to get user's assigned schedule ID
 * @returns Work hours operations object
 */
export const createWorkHoursOperations = (
  defaultSchedule: WorkSchedule,
  schedules: WorkSchedule[],
  getUserSchedule: (userId: string) => string
) => {
  // Store the last time we refreshed schedule data
  let lastScheduleRefreshTime = Date.now();

  /**
   * Gets default hours from schedule for a specific date and user
   * 
   * @param date The date to get hours for
   * @param userId The user ID
   * @returns Object containing startTime and endTime
   */
  const getDefaultHoursFromSchedule = (date: Date, userId: string): { startTime: string; endTime: string } => {
    try {
      // Always get the latest schedule ID for the user - this is crucial for synchronization
      const userScheduleId = getUserSchedule(userId);
      let selectedSchedule: WorkSchedule;
      
      // Use latest schedule data - Force fresh lookup every time
      if (userScheduleId === 'default') {
        // Direct lookup ensures we get the most current data
        selectedSchedule = defaultSchedule;
        logger.debug(`Using default schedule for user ${userId}`);
      } else {
        // Find the user's schedule in the current schedules array
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
      
      // Get day schedule information from the selected schedule
      const daySchedule = getDayScheduleInfo(date, selectedSchedule);
      
      // Extract hours if available
      if (daySchedule && daySchedule.isWorkingDay && daySchedule.hours) {
        logger.debug(`Derived hours for ${userId} on ${format(date, 'yyyy-MM-dd')} from schedule: ${daySchedule.hours.startTime}-${daySchedule.hours.endTime}`);
        return {
          startTime: daySchedule.hours.startTime || '',
          endTime: daySchedule.hours.endTime || ''
        };
      }
      
      logger.debug(`No schedule hours found for ${userId} on ${format(date, 'yyyy-MM-dd')}, using empty defaults`);
      return { startTime: "", endTime: "" };
    } catch (error) {
      logger.error(`Error getting default hours from schedule: ${error}`);
      return { startTime: "", endTime: "" };
    }
  };

  /**
   * Gets the timestamp of the last schedule refresh
   * @returns Timestamp of last refresh
   */
  const getLastRefreshTime = () => lastScheduleRefreshTime;

  return { 
    getDefaultHoursFromSchedule,
    getLastRefreshTime 
  };
};
