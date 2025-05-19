
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, WorkSchedule } from '@/types';
import { useAuth } from '@/contexts/auth';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('UserTimesheetContext');

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
  
  // Import the work schedule context to access schedule data
  const { getUserSchedule } = useWorkSchedule();
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  
  // Update viewedUser when currentUser changes
  useEffect(() => {
    setViewedUser(currentUser);
  }, [currentUser]);
  
  // Fetch the work schedule whenever viewedUser changes
  useEffect(() => {
    if (viewedUser) {
      try {
        logger.debug(`Fetching work schedule for user: ${viewedUser.id}`);
        const schedule = getUserSchedule(viewedUser.id);
        
        if (schedule) {
          logger.debug(`Found work schedule for user: ${schedule.name || 'unnamed'}`);
          setWorkSchedule(schedule);
        } else {
          logger.debug(`No work schedule found for user ${viewedUser.id}, using default`);
          // The getUserSchedule already returns default schedule if no custom one is assigned
          setWorkSchedule(null);
        }
      } catch (error) {
        logger.error(`Error fetching work schedule for user ${viewedUser?.id}:`, error);
        setWorkSchedule(null);
      }
    } else {
      setWorkSchedule(null);
    }
  }, [viewedUser, getUserSchedule]);

  return (
    <UserTimesheetContext.Provider 
      value={{ 
        viewedUser, 
        isViewingOtherUser: false, 
        canViewTimesheet: !!viewedUser, 
        canEditTimesheet: !!viewedUser,
        workSchedule
      }}
    >
      {children}
    </UserTimesheetContext.Provider>
  );
};
