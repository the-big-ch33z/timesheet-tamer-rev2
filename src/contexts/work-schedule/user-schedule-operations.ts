
import { WorkSchedule, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { WorkScheduleState } from './internal-types';

interface UserScheduleProps {
  state: WorkScheduleState;
  setState: React.Dispatch<React.SetStateAction<WorkScheduleState>>;
  updateUserWorkScheduleId: (userId: string, scheduleId: string) => Promise<void>;
  toast: ReturnType<typeof useToast>['toast'];
}

interface UserScheduleOperations {
  assignScheduleToUser: (userId: string, scheduleId: string) => Promise<void>;
  getUserSchedule: (userId: string) => WorkSchedule;
  resetUserSchedule: (userId: string) => Promise<void>;
}

// Cache for getUserSchedule results
const scheduleCache = new Map<string, { schedule: WorkSchedule; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const createUserScheduleOperations = ({
  state,
  setState,
  updateUserWorkScheduleId,
  toast
}: UserScheduleProps): UserScheduleOperations => {
  // Assign a schedule to a user - this is the primary function that needs to be updated
  const assignScheduleToUser = async (userId: string, scheduleId: string) => {
    console.log(`Assigning schedule ${scheduleId} to user ${userId}`);
    
    if (scheduleId !== 'default' && !state.schedules.some(s => s.id === scheduleId)) {
      toast({
        title: 'Invalid schedule',
        description: 'The selected schedule does not exist',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // THE KEY CHANGE: Focus solely on updating the user object first
      // This makes the user.workScheduleId the single source of truth
      await updateUserWorkScheduleId(userId, scheduleId);
      
      // Once user object is updated, then update our in-memory cache
      // This is now a derived state, not a source of truth
      if (scheduleId === 'default') {
        // If assigning default, just remove from userSchedules cache
        setState(prev => {
          const newUserSchedules = { ...prev.userSchedules };
          delete newUserSchedules[userId];
          return { ...prev, userSchedules: newUserSchedules };
        });
      } else {
        // FIXED: Store scheduleId directly as a string, not in a nested object
        setState(prev => ({
          ...prev,
          userSchedules: {
            ...prev.userSchedules,
            [userId]: scheduleId // Directly assign scheduleId as a string
          }
        }));
      }
      
      // Clear schedule cache for this user to ensure fresh data
      scheduleCache.delete(userId);
      
      console.log(`Schedule ${scheduleId} successfully assigned to user ${userId}`);
      
      toast({
        title: 'Schedule assigned',
        description: 'Work schedule has been assigned to the user',
      });
    } catch (error) {
      console.error("Error assigning schedule to user:", error);
      toast({
        title: 'Error',
        description: 'Failed to assign schedule to user',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get the schedule for a user - with caching
  const getUserSchedule = (userId: string): WorkSchedule => {
    // Check cache first
    const cachedEntry = scheduleCache.get(userId);
    const now = Date.now();
    
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_EXPIRY)) {
      return cachedEntry.schedule;
    }
    
    // Only log when we're actually retrieving, not on every call
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Getting schedule for user ${userId}, assigned ID: ${state.userSchedules[userId]}`);
    }
    
    // First try to get from the in-memory userSchedules cache
    const assignedScheduleId = state.userSchedules[userId];
    
    // FIXED: Validate that assignedScheduleId is a string, not an object
    if (!assignedScheduleId || typeof assignedScheduleId !== 'string') {
      // Cache default schedule for this user
      scheduleCache.set(userId, {
        schedule: state.defaultSchedule,
        timestamp: now
      });
      return state.defaultSchedule;
    }
    
    const assignedSchedule = state.schedules.find(s => s.id === assignedScheduleId);
    if (!assignedSchedule) {
      console.warn(`Schedule ${assignedScheduleId} not found for user ${userId}, using default`);
      // Cache default schedule when assigned one not found
      scheduleCache.set(userId, {
        schedule: state.defaultSchedule,
        timestamp: now
      });
      return state.defaultSchedule;
    }
    
    // Cache the found schedule
    scheduleCache.set(userId, {
      schedule: assignedSchedule,
      timestamp: now
    });
    return assignedSchedule;
  };

  // Reset a user to the default schedule
  const resetUserSchedule = async (userId: string) => {
    console.log(`Resetting user ${userId} to default schedule`);
    
    try {
      // First update the user object to remove the custom schedule ID
      // This is the source of truth
      await updateUserWorkScheduleId(userId, 'default');
      
      // Then update the local state (cache)
      setState(prev => {
        const newUserSchedules = { ...prev.userSchedules };
        delete newUserSchedules[userId];
        return { ...prev, userSchedules: newUserSchedules };
      });
      
      // Clear cache for this user
      scheduleCache.delete(userId);
      
      toast({
        title: 'Schedule reset',
        description: 'User will now use the default work schedule',
      });
    } catch (error) {
      console.error("Error resetting user schedule:", error);
      toast({
        title: 'Error',
        description: 'Failed to reset user schedule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    assignScheduleToUser,
    getUserSchedule,
    resetUserSchedule
  };
};

// Export function to clear cache from outside
export const clearAllScheduleCache = () => {
  scheduleCache.clear();
};
