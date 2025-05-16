
import { useState, useEffect } from 'react';
import { WorkSchedule } from '@/types';
import { WorkScheduleContextType, SCHEDULES_STORAGE_KEY, USER_SCHEDULES_STORAGE_KEY } from './types';
import { defaultWorkSchedule } from './defaultSchedule';
import { createStorageOperations } from './storage-utils';
import { createTimeLogger } from '@/utils/time/errors';
import { eventBus } from '@/utils/events/EventBus';
import { SCHEDULE_EVENTS } from '@/utils/events/eventTypes';

// Create a logger for this hook
const logger = createTimeLogger('useWorkScheduleContext');

export const useWorkScheduleContext = (): WorkScheduleContextType => {
  const storageOps = createStorageOperations();
  const [defaultSchedule, setDefaultSchedule] = useState<WorkSchedule>(defaultWorkSchedule);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([defaultWorkSchedule]);
  const [userSchedules, setUserSchedules] = useState<Record<string, string>>({});

  // Load schedules from localStorage on component mount
  useEffect(() => {
    const loadedSchedules = storageOps.loadSchedules();
    setSchedules(loadedSchedules);
    
    // Set the default schedule (should be the one with isDefault = true)
    const loadedDefault = loadedSchedules.find(s => s.isDefault);
    if (loadedDefault) {
      setDefaultSchedule(loadedDefault);
    }
    
    const loadedUserSchedules = storageOps.loadUserSchedules();
    setUserSchedules(loadedUserSchedules);
    
    logger.debug('Loaded schedules from storage', { 
      schedulesCount: loadedSchedules.length, 
      userSchedulesCount: Object.keys(loadedUserSchedules).length 
    });
  }, []);

  // Update default schedule
  const updateDefaultSchedule = (schedule: WorkSchedule) => {
    const updatedSchedules = schedules.map(s => {
      if (s.isDefault) {
        return { ...schedule, isDefault: true };
      }
      return s;
    });
    
    setDefaultSchedule({ ...schedule, isDefault: true });
    setSchedules(updatedSchedules);
    storageOps.saveSchedules(updatedSchedules);
    
    logger.debug('Updated default schedule', { scheduleId: schedule.id });
    
    // Notify system that the default schedule changed
    eventBus.publish(SCHEDULE_EVENTS.DEFAULT_UPDATED, {
      scheduleId: schedule.id,
      timestamp: Date.now()
    });
  };

  // Create a new schedule
  const createSchedule = (schedule: WorkSchedule) => {
    const newSchedules = [...schedules, schedule];
    setSchedules(newSchedules);
    storageOps.saveSchedules(newSchedules);
    
    logger.debug('Created new schedule', { scheduleId: schedule.id, name: schedule.name });
  };

  // Update an existing schedule
  const updateSchedule = (scheduleId: string, updates: Partial<WorkSchedule>) => {
    const updatedSchedules = schedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, ...updates };
      }
      return s;
    });
    
    setSchedules(updatedSchedules);
    storageOps.saveSchedules(updatedSchedules);
    
    logger.debug('Updated schedule', { scheduleId, updates });
    
    // Notify system that a schedule was updated
    eventBus.publish(SCHEDULE_EVENTS.UPDATED, {
      scheduleId,
      timestamp: Date.now()
    });
  };

  // Delete a schedule
  const deleteSchedule = (scheduleId: string) => {
    // Don't allow deletion of the default schedule
    if (scheduleId === 'default') {
      logger.warn('Attempted to delete default schedule');
      return;
    }
    
    const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updatedSchedules);
    storageOps.saveSchedules(updatedSchedules);
    
    // Remove this schedule from any users who have it assigned
    const updatedUserSchedules = { ...userSchedules };
    for (const userId in updatedUserSchedules) {
      if (updatedUserSchedules[userId] === scheduleId) {
        delete updatedUserSchedules[userId];
      }
    }
    setUserSchedules(updatedUserSchedules);
    storageOps.saveUserSchedules(updatedUserSchedules);
    
    logger.debug('Deleted schedule', { scheduleId });
    
    // Notify system that a schedule was deleted
    eventBus.publish(SCHEDULE_EVENTS.DELETED, {
      scheduleId,
      timestamp: Date.now()
    });
  };

  // Get a specific schedule by ID
  const getScheduleById = (scheduleId: string): WorkSchedule | undefined => {
    if (scheduleId === 'default') {
      return defaultSchedule;
    }
    return schedules.find(s => s.id === scheduleId);
  };

  // Assign a schedule to a user
  const assignScheduleToUser = (userId: string, scheduleId: string) => {
    // Ensure this is a valid schedule before assigning
    const schedule = getScheduleById(scheduleId);
    if (!schedule) {
      logger.warn(`Attempted to assign non-existent schedule ${scheduleId} to user ${userId}`);
      return;
    }
    
    const updatedUserSchedules = { ...userSchedules, [userId]: scheduleId };
    setUserSchedules(updatedUserSchedules);
    storageOps.saveUserSchedules(updatedUserSchedules);
    
    logger.debug(`Assigned schedule ${scheduleId} to user ${userId}`);
    
    // Notify system that user schedule was updated
    eventBus.publish(SCHEDULE_EVENTS.USER_SCHEDULE_UPDATED, {
      userId,
      scheduleId,
      timestamp: Date.now()
    });
  };

  // Get a user's assigned schedule
  const getUserSchedule = (userId: string): WorkSchedule => {
    const scheduleId = userSchedules[userId];
    if (scheduleId) {
      const userSchedule = getScheduleById(scheduleId);
      if (userSchedule) {
        logger.debug(`Found assigned schedule ${scheduleId} for user ${userId}`);
        return userSchedule;
      }
      logger.warn(`User ${userId} is assigned to non-existent schedule ${scheduleId}`);
    }
    
    logger.debug(`No schedule found for user ${userId}, returning default schedule`);
    return defaultSchedule;
  };

  // Reset a user's schedule to the default
  const resetUserSchedule = (userId: string) => {
    const updatedUserSchedules = { ...userSchedules };
    updatedUserSchedules[userId] = 'default';
    setUserSchedules(updatedUserSchedules);
    storageOps.saveUserSchedules(updatedUserSchedules);
    
    logger.debug(`Reset user ${userId} to default schedule`);
    
    // Notify system that user schedule was updated
    eventBus.publish(SCHEDULE_EVENTS.USER_SCHEDULE_UPDATED, {
      userId,
      scheduleId: 'default',
      timestamp: Date.now()
    });
  };

  // Get all available schedules
  const getAllSchedules = (): WorkSchedule[] => {
    return schedules;
  };

  // Listen for external updates to schedules
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === SCHEDULES_STORAGE_KEY && event.newValue) {
        try {
          const updatedSchedules = JSON.parse(event.newValue);
          setSchedules(updatedSchedules);
          
          // Update default schedule if needed
          const updatedDefault = updatedSchedules.find(s => s.isDefault);
          if (updatedDefault) {
            setDefaultSchedule(updatedDefault);
          }
        } catch (err) {
          logger.error('Error parsing schedules from storage event', err);
        }
      } else if (event.key === USER_SCHEDULES_STORAGE_KEY && event.newValue) {
        try {
          const updatedUserSchedules = JSON.parse(event.newValue);
          setUserSchedules(updatedUserSchedules);
        } catch (err) {
          logger.error('Error parsing user schedules from storage event', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return {
    defaultSchedule,
    schedules,
    userSchedules,
    updateDefaultSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    assignScheduleToUser,
    getUserSchedule,
    resetUserSchedule,
    getAllSchedules
  };
};
