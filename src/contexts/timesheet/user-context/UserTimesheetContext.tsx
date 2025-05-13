
import React, { createContext, useContext, ReactNode } from 'react';
import { useTimesheetContext as useTimesheetUserContext } from '@/hooks/timesheet/useTimesheetContext';
import { UserTimesheetContextType } from '../types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('UserTimesheetContext');

const UserTimesheetContext = createContext<UserTimesheetContextType | undefined>(undefined);

export interface UserTimesheetProviderProps {
  children: ReactNode;
}

/**
 * UserTimesheetProvider
 * 
 * Provides information about the user whose timesheet is being viewed
 * 
 * @dependency useTimesheetUserContext - Uses the timesheet user hook from application state
 * 
 * Dependencies Flow:
 * - This context depends on the application auth state
 * - Other contexts may use this context to access user information
 */
export const UserTimesheetProvider: React.FC<UserTimesheetProviderProps> = ({ children }) => {
  const {
    targetUserId,
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    userWorkSchedule
  } = useTimesheetUserContext();
  
  // Log user context information
  React.useEffect(() => {
    logger.debug('UserTimesheetContext initialized', {
      viewedUser: viewedUser?.id,
      isViewingOtherUser,
      canViewTimesheet,
      hasWorkSchedule: !!userWorkSchedule
    });
  }, [viewedUser, isViewingOtherUser, canViewTimesheet, userWorkSchedule]);
  
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

/**
 * useUserTimesheetContext
 * 
 * Hook to access information about the user whose timesheet is being viewed
 * 
 * @returns {UserTimesheetContextType} User timesheet context value
 * @throws {Error} If used outside of a UserTimesheetProvider
 */
export const useUserTimesheetContext = (): UserTimesheetContextType => {
  const context = useContext(UserTimesheetContext);
  if (!context) {
    throw new Error('useUserTimesheetContext must be used within a UserTimesheetProvider');
  }
  return context;
};
