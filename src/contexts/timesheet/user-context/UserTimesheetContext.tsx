
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
  
  // FIXED: Fetch the work schedule whenever viewedUser changes - ALWAYS provide a schedule
  useEffect(() => {
    if (viewedUser) {
      try {
        logger.debug(`Fetching work schedule for user: ${viewedUser.id}`);
        
        // FIX: getUserSchedule now ALWAYS returns a schedule (never null)
        const schedule = getUserSchedule(viewedUser.id);
        
        logger.debug(`Work schedule retrieved for user: ${schedule.name || 'unnamed'} (${schedule.id})`);
        setWorkSchedule(schedule);
        
        // Add validation logging
        if (!viewedUser.workScheduleId) {
          logger.warn(`User ${viewedUser.name} (${viewedUser.id}) does not have workScheduleId set! Using default schedule.`);
        }
        
      } catch (error) {
        logger.error(`Error fetching work schedule for user ${viewedUser?.id}:`, error);
        // Even on error, try to provide default schedule instead of null
        setWorkSchedule({
          id: 'default',
          name: 'Default Schedule',
          userId: 'system',
          weeks: {
            1: {
              monday: { startTime: '', endTime: '' },
              tuesday: { startTime: '', endTime: '' },
              wednesday: { startTime: '', endTime: '' },
              thursday: { startTime: '', endTime: '' },
              friday: { startTime: '', endTime: '' },
              saturday: null,
              sunday: null
            },
            2: {
              monday: { startTime: '', endTime: '' },
              tuesday: { startTime: '', endTime: '' },
              wednesday: { startTime: '', endTime: '' },
              thursday: { startTime: '', endTime: '' },
              friday: { startTime: '', endTime: '' },
              saturday: null,
              sunday: null
            }
          },
          rdoDays: { 1: [], 2: [] },
          isDefault: true
        });
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
        workSchedule // This will now NEVER be null when viewedUser exists
      }}
    >
      {children}
    </UserTimesheetContext.Provider>
  );
};
