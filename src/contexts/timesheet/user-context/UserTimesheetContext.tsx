
import React, { createContext, useContext, ReactNode } from 'react';
import { useTimesheetContext as useTimesheetUserContext } from '@/hooks/timesheet/useTimesheetContext';
import { User, WorkSchedule } from '@/types';

interface UserTimesheetContextType {
  targetUserId?: string;
  viewedUser?: User;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  workSchedule?: WorkSchedule;
}

const UserTimesheetContext = createContext<UserTimesheetContextType | undefined>(undefined);

export const useUserTimesheetContext = (): UserTimesheetContextType => {
  const context = useContext(UserTimesheetContext);
  if (!context) {
    throw new Error('useUserTimesheetContext must be used within a UserTimesheetProvider');
  }
  return context;
};

export const UserTimesheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    targetUserId,
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    userWorkSchedule
  } = useTimesheetUserContext();
  
  // This was hardcoded in the original TimesheetContext
  const canEditTimesheet = true;
  
  const value = {
    targetUserId,
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
