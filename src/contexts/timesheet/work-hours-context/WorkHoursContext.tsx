
import React, { createContext, useContext, ReactNode } from 'react';
import { WorkHoursContextType } from './types';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { createWorkHoursOperations } from './workHoursOperations';
import { useWorkHoursState } from './hooks/useWorkHoursState';
import { useWorkHoursStorage } from './hooks/useWorkHoursStorage';
import { useWorkHoursValue } from './hooks/useWorkHoursValue';

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
  
  // Create a wrapper function to extract schedule ID
  const getUserScheduleId = (userId: string): string => {
    const schedule = getUserSchedule(userId);
    return schedule?.id || 'default';
  };

  // Initialize operations with the wrapper function
  const { getDefaultHoursFromSchedule } = createWorkHoursOperations(
    defaultSchedule,
    schedules,
    getUserScheduleId
  );

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

  // Create context value
  const value = useWorkHoursValue({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });

  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
