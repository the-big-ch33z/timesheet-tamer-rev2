
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { WorkHoursContextType } from './types';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { createWorkHoursOperations } from './workHoursOperations';
import { useWorkHoursState } from './hooks/useWorkHoursState';
import { useWorkHoursStorage } from './hooks/useWorkHoursStorage';
import { useWorkHoursValue } from './hooks/useWorkHoursValue';
import { clearWorkHoursCache } from './hooks/useWorkHoursCore';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

export const useWorkHoursContext = (): WorkHoursContextType => {
  const context = useContext(WorkHoursContext);
  if (!context) {
    throw new Error('useWorkHoursContext must be used within a WorkHoursProvider');
  }
  return context;
};

interface WorkHoursProviderProps {
  children: ReactNode;
}

export const WorkHoursProvider: React.FC<WorkHoursProviderProps> = ({ children }) => {
  const { defaultSchedule, schedules, getUserSchedule } = useWorkSchedule();
  
  // Create a wrapper function to extract schedule ID with cached lookup
  const getUserScheduleId = React.useCallback((userId: string): string => {
    const schedule = getUserSchedule(userId);
    return schedule?.id || 'default';
  }, [getUserSchedule]);

  // Initialize operations with the wrapper function using useMemo
  const { getDefaultHoursFromSchedule } = React.useMemo(() => (
    createWorkHoursOperations(
      defaultSchedule,
      schedules,
      getUserScheduleId
    )
  ), [defaultSchedule, schedules, getUserScheduleId]);

  // Use our new hooks
  const {
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    saveTimeoutRef,
    isInitializedRef,
  } = useWorkHoursState();

  // Set up storage synchronization
  useWorkHoursStorage({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    saveTimeoutRef,
    isInitializedRef
  });

  // Create context value with memoization
  const value = useWorkHoursValue({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });

  // Listen for schedule update events to clear caches
  useEffect(() => {
    const handleSchedulesUpdated = () => {
      console.debug('WorkHoursContext: Schedules updated, clearing work hours cache');
      clearWorkHoursCache();
    };
    
    timeEventsService.subscribe('schedules-updated', handleSchedulesUpdated);
    timeEventsService.subscribe('user-schedules-updated', handleSchedulesUpdated);
    
    return () => {
      timeEventsService.unsubscribe('schedules-updated', handleSchedulesUpdated);
      timeEventsService.unsubscribe('user-schedules-updated', handleSchedulesUpdated);
    };
  }, []);

  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
