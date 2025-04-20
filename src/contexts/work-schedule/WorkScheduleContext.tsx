
import React, { createContext, useContext, ReactNode } from 'react';
import { WorkScheduleContextType } from './types';
import { useWorkScheduleContext } from './useWorkScheduleContext';

/**
 * WorkScheduleContext
 * 
 * This context provides work schedule information throughout the application.
 * It serves as the source of truth for:
 *  - Default schedule definitions
 *  - User-specific schedule assignments
 *  - Schedule management operations
 * 
 * Integration:
 * The WorkHoursContext consumes this context to:
 *  1. Derive default working hours for each user/day
 *  2. Determine if a day is scheduled as working or non-working
 *  3. Provide fallback values when custom hours are not set
 */
const WorkScheduleContext = createContext<WorkScheduleContextType | undefined>(undefined);

/**
 * Hook to access the WorkSchedule context
 * This is consumed by both UI components and other contexts (like WorkHoursContext)
 */
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
