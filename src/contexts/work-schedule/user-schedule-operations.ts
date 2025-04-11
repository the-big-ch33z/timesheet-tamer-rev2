
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

export const createUserScheduleOperations = ({
  state,
  setState,
  updateUserWorkScheduleId,
  toast
}: UserScheduleProps): UserScheduleOperations => {
  // Assign a schedule to a user
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
      if (scheduleId === 'default') {
        // If assigning default, just remove from userSchedules
        setState(prev => {
          const newUserSchedules = { ...prev.userSchedules };
          delete newUserSchedules[userId];
          return { ...prev, userSchedules: newUserSchedules };
        });
        
        // Update the user object to clear the custom schedule ID
        await updateUserWorkScheduleId(userId, 'default');
        
        console.log(`User ${userId} reset to default schedule`);
      } else {
        // Assign the custom schedule
        setState(prev => ({
          ...prev,
          userSchedules: {
            ...prev.userSchedules,
            [userId]: scheduleId
          }
        }));
        
        // Update the user object to store the schedule ID
        await updateUserWorkScheduleId(userId, scheduleId);
        
        console.log(`Custom schedule ${scheduleId} assigned to user ${userId}`);
      }
      
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
    }
  };

  // Get the schedule for a user
  const getUserSchedule = (userId: string): WorkSchedule => {
    const assignedScheduleId = state.userSchedules[userId];
    console.log(`Getting schedule for user ${userId}, assigned ID: ${assignedScheduleId}`);
    
    if (!assignedScheduleId) return state.defaultSchedule;
    
    const assignedSchedule = state.schedules.find(s => s.id === assignedScheduleId);
    if (!assignedSchedule) {
      console.warn(`Schedule ${assignedScheduleId} not found for user ${userId}, using default`);
    }
    return assignedSchedule || state.defaultSchedule;
  };

  // Reset a user to the default schedule
  const resetUserSchedule = async (userId: string) => {
    setState(prev => {
      const newUserSchedules = { ...prev.userSchedules };
      delete newUserSchedules[userId];
      return { ...prev, userSchedules: newUserSchedules };
    });
    
    // Update the user object to remove the custom schedule ID
    await updateUserWorkScheduleId(userId, 'default');
    
    toast({
      title: 'Schedule reset',
      description: 'User will now use the default work schedule',
    });
  };

  return {
    assignScheduleToUser,
    getUserSchedule,
    resetUserSchedule
  };
};
