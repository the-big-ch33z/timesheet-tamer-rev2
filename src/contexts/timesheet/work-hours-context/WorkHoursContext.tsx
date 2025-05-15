import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useWorkHoursValue } from './hooks/useWorkHoursValue';
import { WorkHoursContextType } from './types';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { getFortnightWeek, getWeekDay } from '@/utils/time/scheduleUtils';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS, SCHEDULE_EVENTS } from '@/utils/events/eventTypes';

// Create logger
const logger = createTimeLogger('WorkHoursContext');

// Create the context
const WorkHoursContext = createContext<WorkHoursContextType | null>(null);

export interface WorkHoursProviderProps {
  children: React.ReactNode;
}

// Provider component
export const WorkHoursProvider: React.FC<WorkHoursProviderProps> = ({ children }) => {
  // Main state for work hours
  const [workHoursMap, setWorkHoursMap] = useState<Map<string, any>>(() => {
    // Initialize from localStorage if available
    try {
      const savedData = localStorage.getItem('work-hours-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const newMap = new Map();
        Object.entries(parsed).forEach(([key, value]) => {
          newMap.set(key, value);
        });
        logger.debug('Loaded work hours from localStorage');
        return newMap;
      }
    } catch (error) {
      logger.error('Error loading work hours from localStorage:', error);
    }
    return new Map();
  });
  
  // Reference to always get the latest map without re-renders
  const latestWorkHoursRef = useRef<Map<string, any>>(workHoursMap);
  
  // Keep the ref in sync with state
  useEffect(() => {
    latestWorkHoursRef.current = workHoursMap;
  }, [workHoursMap]);
  
  // Save to localStorage when workHoursMap changes
  useEffect(() => {
    try {
      const storageData = Array.from(workHoursMap.entries()).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
      
      localStorage.setItem('work-hours-data', JSON.stringify(storageData));
      logger.debug('Saved work hours to localStorage');
    } catch (error) {
      logger.error('Error saving to localStorage:', error);
    }
  }, [workHoursMap]);
  
  // Get work schedule context for default hours calculation
  const { getUserSchedule, getScheduleById } = useWorkSchedule();
  
  // Function to get default hours from a user's schedule
  const getDefaultHoursFromSchedule = (date: Date, userId: string) => {
    try {
      // Get the user's schedule or default if not available
      const userSchedule = getUserSchedule(userId);
      const userScheduleId = userSchedule?.id || 'default'; // Fixed: Using id instead of scheduleId
      const schedule = getScheduleById(userScheduleId);
      
      if (!schedule) {
        logger.debug(`No schedule found for user ${userId}, using empty hours`);
        return { startTime: '', endTime: '' };
      }
      
      // Determine the week in the fortnight cycle
      const fortnightWeek = getFortnightWeek(date);
      
      // Get the day of the week
      const weekDay = getWeekDay(date);
      
      // Get the day config from the schedule
      const dayConfig = schedule.weeks[fortnightWeek]?.[weekDay];
      
      if (!dayConfig || dayConfig === null) {
        logger.debug(`No day config for ${weekDay} in week ${fortnightWeek}, using empty hours`);
        return { startTime: '', endTime: '' };
      }
      
      // Return the actual schedule times without fallbacks
      return {
        startTime: dayConfig.startTime || '',
        endTime: dayConfig.endTime || ''
      };
    } catch (error) {
      logger.error('Error getting default hours from schedule', error);
      return { startTime: '', endTime: '' };
    }
  };
  
  // Create the context value using our hook
  const contextValue = useWorkHoursValue({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });
  
  // Add the missing refreshWorkHours method to the context value
  const refreshWorkHours = (userId: string) => {
    logger.debug(`Refreshing all work hours for user ${userId}`);
    // Trigger a re-render of the context by creating a new map with the same values
    setWorkHoursMap(prevMap => new Map(prevMap));
    
    // Publish a refresh event
    timeEventsService.publish(WORK_HOURS_EVENTS.REFRESHED, {
      userId,
      timestamp: Date.now()
    });
  };
  
  const enhancedContextValue = {
    ...contextValue,
    refreshWorkHours
  };
  
  // Listen for work-hours-related events to keep synced
  useEffect(() => {
    const unsubscribeReset = timeEventsService.subscribe(WORK_HOURS_EVENTS.RESET, (event) => {
      if (event.date && event.userId) {
        logger.debug(`Received work hours reset event for ${event.date}, ${event.userId}`);
      }
    });
    
    const unsubscribeSchedule = timeEventsService.subscribe(SCHEDULE_EVENTS.UPDATED, () => {
      logger.debug('Received schedule update event, will refresh hours as needed');
    });
    
    return () => {
      unsubscribeReset.unsubscribe();
      unsubscribeSchedule.unsubscribe();
    };
  }, []);
  
  return (
    <WorkHoursContext.Provider value={enhancedContextValue}>
      {children}
    </WorkHoursContext.Provider>
  );
};

// Custom hook to use the work hours context
export const useWorkHoursContext = (): WorkHoursContextType => {
  const context = useContext(WorkHoursContext);
  if (!context) {
    throw new Error('useWorkHoursContext must be used within a WorkHoursProvider');
  }
  return context;
};
