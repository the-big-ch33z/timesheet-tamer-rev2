
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, WorkSchedule } from '@/types';
import { useAuth } from '@/contexts/auth';

interface UserTimesheetContextType {
  viewedUser: User | null;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  workSchedule: WorkSchedule | null;
}

const UserTimesheetContext = createContext<UserTimesheetContextType | undefined>(undefined);

export const useUserTimesheetContext = () => {
  const context = useContext(UserTimesheetContext);
  if (context === undefined) {
    throw new Error('useUserTimesheetContext must be used within a UserTimesheetProvider');
  }
  return context;
};

export const UserTimesheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the actual authenticated user from auth context
  const { currentUser } = useAuth();
  const [viewedUser, setViewedUser] = useState<User | null>(currentUser);

  // Update viewedUser when currentUser changes
  useEffect(() => {
    setViewedUser(currentUser);
  }, [currentUser]);

  return (
    <UserTimesheetContext.Provider 
      value={{ 
        viewedUser, 
        isViewingOtherUser: false, 
        canViewTimesheet: !!viewedUser, 
        canEditTimesheet: !!viewedUser,
        workSchedule: null
      }}
    >
      {children}
    </UserTimesheetContext.Provider>
  );
};
