
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { WorkHoursContextType } from './types';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { createWorkHoursOperations } from './workHoursOperations';
import { useWorkHoursState } from './hooks/useWorkHoursState';
import { useWorkHoursStorage } from './hooks/useWorkHoursStorage';
import { useWorkHoursValue } from './hooks/useWorkHoursValue';
import { clearWorkHoursCache } from './hooks/useWorkHoursCore';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

/**
 * WorkHoursContext
 * 
 * Manages work hours data for users across different dates
 * Responsible for:
 * - Loading and saving work hours
 * - Calculating default work hours from schedules
 * - Managing custom work hours overrides
 * - Event communication for work hours changes
 *
 * Dependencies:
 * - WorkScheduleContext: Used for getting default hours from schedules
 * - timeEventsService: Used for broadcasting work hours changes
 */

const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

/**
 * useWorkHoursContext
 * Primary hook for accessing work hours functionality
 */
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

/**
 * WorkHoursProvider
 * Context provider that manages work hours data and operations
 */
export const WorkHoursProvider: React.FC<WorkHoursProviderProps> = ({ children }) => {
  // Get schedule data from work schedule context
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

  // Initialize state management
  const {
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    saveTimeoutRef,
    isInitializedRef,
    cleanupCache
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
    
    // Store subscriptions to clean them up properly
    const schedulesSubscription = timeEventsService.subscribe('schedules-updated', handleSchedulesUpdated);
    const userSchedulesSubscription = timeEventsService.subscribe('user-schedules-updated', handleSchedulesUpdated);
    
    // Periodically clean up cache to prevent memory leaks
    const cleanupInterval = setInterval(cleanupCache, 60 * 60 * 1000); // Every hour
    
    return () => {
      // Properly unsubscribe from each subscription object
      schedulesSubscription.unsubscribe();
      userSchedulesSubscription.unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [cleanupCache]);

  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
