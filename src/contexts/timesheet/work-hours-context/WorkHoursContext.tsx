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
  const [workHoursMap, setWorkHoursMap] = useState<Map<string, any>>(new Map());
  
  // Reference to always get the latest map without re-renders
  const latestWorkHoursRef = useRef<Map<string, any>>(workHoursMap);
  
  // Keep the ref in sync with state
  useEffect(() => {
    latestWorkHoursRef.current = workHoursMap;
  }, [workHoursMap]);
  
  // Get work schedule context for default hours calculation
  const { getUserSchedule, getScheduleById } = useWorkSchedule();
  
  // Function to get default hours from a user's schedule
  const getDefaultHoursFromSchedule = (date: Date, userId: string) => {
    try {
      // Get the user's schedule or default if not available
      const userScheduleId = getUserSchedule(userId)?.scheduleId || 'default';
      const schedule = getScheduleById(userScheduleId);
      
      if (!schedule) {
        logger.debug(`No schedule found for user ${userId}, using default hours`);
        return { startTime: '09:00', endTime: '17:00' };
      }
      
      // Determine the week in the fortnight cycle
      const fortnightWeek = getFortnightWeek(date);
      
      // Get the day of the week
      const weekDay = getWeekDay(date);
      
      // Get the day config from the schedule
      const dayConfig = schedule.weeks[fortnightWeek]?.[weekDay];
      
      if (!dayConfig || dayConfig === null) {
        logger.debug(`No day config for ${weekDay} in week ${fortnightWeek}, using default hours`);
        return { startTime: '', endTime: '' };
      }
      
      return {
        startTime: dayConfig.startTime || '09:00',
        endTime: dayConfig.endTime || '17:00'
      };
    } catch (error) {
      logger.error('Error getting default hours from schedule', error);
      return { startTime: '09:00', endTime: '17:00' };
    }
  };
  
  // Create the context value using our hook
  const contextValue = useWorkHoursValue({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });
  
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
    <WorkHoursContext.Provider value={contextValue}>
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
