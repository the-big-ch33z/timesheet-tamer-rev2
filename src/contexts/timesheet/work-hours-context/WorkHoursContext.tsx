
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { WorkHoursContextType, WorkHoursData } from '../types';
import { useWorkHoursManagement } from './hooks/useWorkHoursManagement';
import { useWorkHoursLogger } from './hooks/useWorkHoursLogger';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { clearWorkHoursCache } from './hooks/useWorkHoursCore';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { useWorkHoursSynchronizer } from './hooks/useWorkHoursSynchronizer';

const logger = createTimeLogger('WorkHoursContext');

// Create context with default values
const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

export interface WorkHoursProviderProps {
  children: React.ReactNode;
}

/**
 * WorkHoursProvider
 * 
 * Provides work hours data and operations to manipulate them
 * 
 * @dependency None - This is a root-level context that doesn't depend on other contexts
 * 
 * Dependencies Flow:
 * - User components may depend on WorkHoursContext
 * - This context may be used by TimeEntryContext for hours calculation
 */
export const WorkHoursProvider: React.FC<WorkHoursProviderProps> = ({ children }) => {
  // State for work hours
  const [workHoursMap, setWorkHoursMap] = useState<Map<string, WorkHoursData>>(new Map());
  const latestWorkHoursRef = React.useRef<Map<string, WorkHoursData>>(new Map());
  
  // Get work schedule to derive default times
  const workScheduleContext = useWorkSchedule();
  
  // Utility hooks
  const { logWorkHoursRetrieval, logDefaultHours, logCustomHoursCheck } = useWorkHoursLogger();
  
  // Load the synchronizer hook
  const { synchronizeFromRemote } = useWorkHoursSynchronizer({
    setWorkHoursMap
  });
  
  // Management operations
  const { 
    resetDayWorkHours, 
    refreshTimesForDate,
  } = useWorkHoursManagement({
    workHoursMap,
    setWorkHoursMap
  });

  /**
   * Check if custom work hours exist for a specific date and user
   * 
   * @param date - The date to check
   * @param userId - The user ID
   * @returns {boolean} Whether custom hours exist
   */
  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const hasHours = workHoursMap.has(key);
    
    logCustomHoursCheck(dateString, userId, hasHours);
    
    return hasHours;
  }, [workHoursMap, logCustomHoursCheck]);

  /**
   * Get default hours from the user's schedule
   * 
   * @param date - The date to get default hours for
   * @param userId - The user ID
   * @returns Default work hours from schedule
   */
  const getDefaultScheduleHours = useCallback((date: Date, userId: string) => {
    try {
      // Get the user schedule
      const userScheduleId = workScheduleContext.getUserScheduleId(userId);
      const schedule = userScheduleId === 'default' 
        ? workScheduleContext.defaultSchedule
        : workScheduleContext.getScheduleById(userScheduleId) || workScheduleContext.defaultSchedule;
      
      // Get the day info from the schedule
      const dayInfo = workScheduleContext.getDayScheduleInfo(date, schedule);
      
      if (dayInfo && dayInfo.isWorkingDay && dayInfo.hours) {
        return {
          startTime: dayInfo.hours.startTime,
          endTime: dayInfo.hours.endTime
        };
      }
      
      // Fall back to standard hours if no schedule or not a working day
      return { startTime: "", endTime: "" };
    } catch (error) {
      logger.error(`Error getting default hours from schedule: ${error}`);
      return { startTime: "", endTime: "" };
    }
  }, [workScheduleContext]);

  /**
   * Get work hours for a specific date and user
   * 
   * @param date - The date to get hours for
   * @param userId - The user ID
   * @returns Work hours data
   */
  const getWorkHours = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const hours = workHoursMap.get(key);
    
    logWorkHoursRetrieval(dateString, userId, hours);
    
    if (hours) {
      return {
        startTime: hours.startTime || '',
        endTime: hours.endTime || '',
        isCustom: true
      };
    }
    
    // Get default hours from schedule instead of hardcoded values
    const defaultHours = getDefaultScheduleHours(date, userId);
    
    logDefaultHours(dateString, defaultHours.startTime, defaultHours.endTime);
    
    return { 
      startTime: defaultHours.startTime, 
      endTime: defaultHours.endTime, 
      isCustom: false 
    };
  }, [workHoursMap, logWorkHoursRetrieval, logDefaultHours, getDefaultScheduleHours]);

  /**
   * Enhanced API for getting work hours with additional metadata
   * 
   * @param date - The date to get hours for
   * @param userId - The user ID
   * @returns Work hours data with additional metadata
   */
  const getWorkHoursForDate = useCallback((date: Date, userId: string) => {
    const { startTime, endTime, isCustom } = getWorkHours(date, userId);
    
    return { 
      startTime, 
      endTime, 
      isCustom,
      hasData: isCustom 
    };
  }, [getWorkHours]);

  /**
   * Save work hours for a specific date and user
   * 
   * @param date - The date to save hours for
   * @param userId - The user ID
   * @param startTime - The start time in HH:MM format
   * @param endTime - The end time in HH:MM format
   */
  const saveWorkHours = useCallback((date: Date, userId: string, startTime: string, endTime: string): void => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    logger.debug(`Saving work hours for ${dateString}, user ${userId}: ${startTime}-${endTime}`);
    
    setWorkHoursMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(key, {
        startTime,
        endTime,
        date: dateString,
        userId,
        isCustom: true,
        lastModified: Date.now()
      });
      return newMap;
    });
    
    // Update the reference to the latest work hours map
    latestWorkHoursRef.current = new Map(workHoursMap);
  }, [workHoursMap]);

  /**
   * Enhanced API for saving work hours with more flexible parameter order
   * 
   * @param date - The date to save hours for
   * @param startTime - The start time in HH:MM format
   * @param endTime - The end time in HH:MM format
   * @param userId - The user ID
   */
  const saveWorkHoursForDate = useCallback((date: Date, startTime: string, endTime: string, userId: string): void => {
    saveWorkHours(date, userId, startTime, endTime);
  }, [saveWorkHours]);

  /**
   * Clear all work hours for a user
   * 
   * @param userId - The user ID
   */
  const clearWorkHours = useCallback((userId: string): void => {
    logger.debug(`Clearing all work hours for user ${userId}`);
    
    setWorkHoursMap(prevMap => {
      const newMap = new Map();
      
      // Only keep entries that don't belong to this user
      for (const [key, value] of prevMap.entries()) {
        if (value.userId !== userId) {
          newMap.set(key, value);
        }
      }
      
      return newMap;
    });
    
    // Update the reference to the latest work hours map
    latestWorkHoursRef.current = new Map(workHoursMap);
  }, [workHoursMap]);

  // Load work hours from localStorage on mount
  useEffect(() => {
    try {
      const savedWorkHours = localStorage.getItem('work-hours');
      
      if (savedWorkHours) {
        const parsedHours: WorkHoursData[] = JSON.parse(savedWorkHours);
        
        if (Array.isArray(parsedHours)) {
          const newMap = new Map();
          
          parsedHours.forEach(hours => {
            const key = `${hours.userId}-${hours.date}`;
            newMap.set(key, hours);
          });
          
          setWorkHoursMap(newMap);
          latestWorkHoursRef.current = newMap;
          logger.debug(`Loaded ${parsedHours.length} work hour entries from storage`);
        }
      }
    } catch (error) {
      logger.error('Error loading work hours from storage', error);
    }

    // Set up event listeners for schedule changes
    const scheduleUpdatedUnsubscribe = timeEventsService.subscribe('schedules-updated', () => {
      logger.debug('Work schedules updated, clearing work hours cache');
      clearWorkHoursCache();
      // Publish an event to notify components that they should refresh their hours
      timeEventsService.publish('work-hours-refresh-needed', { timestamp: Date.now() });
    });

    const userScheduleUpdatedUnsubscribe = timeEventsService.subscribe('user-schedules-updated', () => {
      logger.debug('User schedules updated, clearing work hours cache');
      clearWorkHoursCache();
      timeEventsService.publish('work-hours-refresh-needed', { timestamp: Date.now() });
    });

    const scheduleChangedUnsubscribe = timeEventsService.subscribe('user-schedule-changed', (data) => {
      logger.debug(`User schedule changed for ${data.userId}, refreshing work hours`);
      clearWorkHoursCache();
      timeEventsService.publish('work-hours-refresh-needed', { 
        userId: data.userId,
        timestamp: Date.now() 
      });
    });

    return () => {
      scheduleUpdatedUnsubscribe.unsubscribe();
      userScheduleUpdatedUnsubscribe.unsubscribe();
      scheduleChangedUnsubscribe.unsubscribe();
    };
  }, []);

  // Save work hours to localStorage when they change
  useEffect(() => {
    if (workHoursMap.size > 0) {
      try {
        const hoursArray = Array.from(workHoursMap.values());
        localStorage.setItem('work-hours', JSON.stringify(hoursArray));
        logger.debug(`Saved ${hoursArray.length} work hour entries to storage`);
      } catch (error) {
        logger.error('Error saving work hours to storage', error);
      }
    }
  }, [workHoursMap]);

  // Context value
  const contextValue: WorkHoursContextType = {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote,
    getDefaultScheduleHours,
    
    // Enhanced API
    getWorkHoursForDate,
    saveWorkHoursForDate
  };

  return (
    <WorkHoursContext.Provider value={contextValue}>
      {children}
    </WorkHoursContext.Provider>
  );
};

/**
 * useWorkHoursContext
 * 
 * Hook to access work hours data and operations
 * 
 * @returns {WorkHoursContextType} Work hours context value
 * @throws {Error} If used outside of a WorkHoursProvider
 */
export const useWorkHoursContext = (): WorkHoursContextType => {
  const context = useContext(WorkHoursContext);
  if (!context) {
    throw new Error('useWorkHoursContext must be used within a WorkHoursProvider');
  }
  return context;
};
