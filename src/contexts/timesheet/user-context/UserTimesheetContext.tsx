
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WorkSchedule } from '@/types';

// Define the context state interface
export interface UserTimesheetState {
  viewedUser: User | null;
  targetUserId: string | null;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  userWorkSchedule: WorkSchedule | null;
}

// Define the context type including state and setters
export interface UserTimesheetContextType extends UserTimesheetState {
  setViewedUser: (user: User | null) => void;
  setTargetUserId: (userId: string | null) => void;
  setUserWorkSchedule: (schedule: WorkSchedule | null) => void;
}

// Sample user data for development
const demoUser: User = {
  id: 'current-user',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'employee'
};

// Create the context with default values
const UserTimesheetContext = createContext<UserTimesheetContextType>({
  viewedUser: null,
  targetUserId: null,
  isViewingOtherUser: false,
  canViewTimesheet: true,
  userWorkSchedule: null,
  setViewedUser: () => {},
  setTargetUserId: () => {},
  setUserWorkSchedule: () => {}
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
  // In a real app, you'd get the current user from authentication
  const currentUser = demoUser;
  
  const [viewedUser, setViewedUser] = useState<User | null>(currentUser);
  const [targetUserId, setTargetUserId] = useState<string | null>(currentUser?.id || null);
  const [userWorkSchedule, setUserWorkSchedule] = useState<WorkSchedule | null>(null);
  
  console.log('UserTimesheetContext - Initializing with:', {
    currentUser: currentUser?.id,
    viewedUser: viewedUser?.id,
    targetUserId
  });

  // Calculate derived state
  const isViewingOtherUser = Boolean(
    currentUser && viewedUser && currentUser.id !== viewedUser.id
  );
  
  // Determine if user can view this timesheet
  const canViewTimesheet = Boolean(viewedUser);

  // Log state changes
  useEffect(() => {
    console.log('UserTimesheetContext - Viewed user updated:', viewedUser?.id);
  }, [viewedUser]);
  
  useEffect(() => {
    console.log('UserTimesheetContext - Target user ID updated:', targetUserId);
  }, [targetUserId]);
  
  useEffect(() => {
    console.log('UserTimesheetContext - Viewing status:', { 
      isViewingOtherUser, 
      canViewTimesheet 
    });
  }, [isViewingOtherUser, canViewTimesheet]);

  const value: UserTimesheetContextType = {
    viewedUser,
    targetUserId,
    isViewingOtherUser,
    canViewTimesheet,
    userWorkSchedule,
    setViewedUser,
    setTargetUserId,
    setUserWorkSchedule
  };

  return (
    <UserTimesheetContext.Provider value={value}>
      {children}
    </UserTimesheetContext.Provider>
  );
};

export default UserTimesheetContext;
