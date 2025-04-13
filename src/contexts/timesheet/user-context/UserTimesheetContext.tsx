
import React, { createContext, useContext, ReactNode } from 'react';
import { useTimesheetContext as useTimesheetUserContext } from '@/hooks/timesheet/useTimesheetContext';
import { UserTimesheetContextType } from '../types';

const UserTimesheetContext = createContext<UserTimesheetContextType | undefined>(undefined);

export const useUserTimesheetContext = (): UserTimesheetContextType => {
  const context = useContext(UserTimesheetContext);
  if (!context) {
    throw new Error('useUserTimesheetContext must be used within a UserTimesheetProvider');
  }
  return context;
};

interface UserTimesheetProviderProps {
  children: ReactNode;
}

export const UserTimesheetProvider: React.FC<UserTimesheetProviderProps> = ({ children }) => {
  const {
    targetUserId,
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    userWorkSchedule
  } = useTimesheetUserContext();
  
  // This was hardcoded in the original TimesheetContext
  const canEditTimesheet = true;
  
  const value: UserTimesheetContextType = {
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    canEditTimesheet,
    workSchedule: userWorkSchedule
  };
  
  return (
    <UserTimesheetContext.Provider value={value}>
      {children}
    </UserTimesheetContext.Provider>
  );
};
