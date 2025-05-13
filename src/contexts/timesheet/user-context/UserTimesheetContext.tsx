
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WorkSchedule } from '@/types';
import { useAuth } from '@/contexts/auth';

// Define the context state interface
export interface UserTimesheetState {
  targetUserId: string | null;
  viewedUser: User | null;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  workSchedule: WorkSchedule | undefined;
}

// Define the context type including state and setters
export interface UserTimesheetContextType extends UserTimesheetState {
  setTargetUserId: (userId: string | null) => void;
}

// Create the context with default values
const UserTimesheetContext = createContext<UserTimesheetContextType>({
  targetUserId: null,
  viewedUser: null,
  isViewingOtherUser: false,
  canViewTimesheet: true,
  canEditTimesheet: true,
  workSchedule: undefined,
  setTargetUserId: () => {}
});

// Export the hook for consuming the context
export const useUserTimesheetContext = () => {
  const context = useContext(UserTimesheetContext);
  if (!context) {
    console.error('useUserTimesheetContext must be used within a UserTimesheetProvider');
  }
  return context;
};

// Provider component
export const UserTimesheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  
  // Determine which user we're viewing (current or another)
  const viewedUser = targetUserId && targetUserId !== currentUser?.id
    ? { 
        id: targetUserId, 
        name: 'Other User', 
        role: 'team-member' as const,
        email: 'other@example.com' // Adding the required email property
      } as User
    : currentUser || null;
    
  const isViewingOtherUser = Boolean(targetUserId && targetUserId !== currentUser?.id);
  
  // For demo purposes, always allow viewing timesheets
  const canViewTimesheet = true;
  
  // Only allow editing if viewing own timesheet or has admin rights
  const canEditTimesheet = !isViewingOtherUser || currentUser?.role === 'admin';
  
  // Work schedule should come from user data in a real app
  const workSchedule = undefined;

  // Value object for the context
  const value: UserTimesheetContextType = {
    targetUserId,
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    canEditTimesheet,
    workSchedule,
    setTargetUserId
  };

  return (
    <UserTimesheetContext.Provider value={value}>
      {children}
    </UserTimesheetContext.Provider>
  );
};

export default UserTimesheetContext;
