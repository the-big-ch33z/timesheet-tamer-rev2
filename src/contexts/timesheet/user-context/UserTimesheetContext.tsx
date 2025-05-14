
import React, { createContext, useContext, useState } from 'react';
import { WorkSchedule } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

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
  // Mock data for demonstration purposes
  const [viewedUser] = useState<User>({
    id: 'current-user',
    name: 'Current User',
    email: 'user@example.com',
    role: 'user'
  });

  return (
    <UserTimesheetContext.Provider 
      value={{ 
        viewedUser, 
        isViewingOtherUser: false, 
        canViewTimesheet: true, 
        canEditTimesheet: true,
        workSchedule: null
      }}
    >
      {children}
    </UserTimesheetContext.Provider>
  );
};
