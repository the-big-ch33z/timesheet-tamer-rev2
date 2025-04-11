
import React, { createContext, useContext, ReactNode } from 'react';
import { WorkScheduleContextType } from './types';
import { useWorkScheduleContext } from './useWorkScheduleContext';

const WorkScheduleContext = createContext<WorkScheduleContextType | undefined>(undefined);

export const useWorkSchedule = (): WorkScheduleContextType => {
  const context = useContext(WorkScheduleContext);
  if (!context) {
    throw new Error('useWorkSchedule must be used within a WorkScheduleProvider');
  }
  return context;
};

export const WorkScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const workScheduleContext = useWorkScheduleContext();

  return (
    <WorkScheduleContext.Provider value={workScheduleContext}>
      {children}
    </WorkScheduleContext.Provider>
  );
};
