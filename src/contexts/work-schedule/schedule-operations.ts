
import { WorkSchedule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { WorkScheduleState } from './internal-types';

interface ScheduleOperations {
  updateDefaultSchedule: (schedule: WorkSchedule) => void;
  createSchedule: (schedule: WorkSchedule) => void;
  updateSchedule: (scheduleId: string, updates: Partial<WorkSchedule>) => void;
  deleteSchedule: (scheduleId: string) => void;
  getScheduleById: (scheduleId: string) => WorkSchedule | undefined;
  getAllSchedules: () => WorkSchedule[];
}

export const createScheduleOperations = (
  state: WorkScheduleState,
  setState: React.Dispatch<React.SetStateAction<WorkScheduleState>>,
  toast: ReturnType<typeof useToast>['toast']
): ScheduleOperations => {
  // Update the default schedule
  const updateDefaultSchedule = (schedule: WorkSchedule) => {
    const updatedSchedule = { ...schedule, isDefault: true };
    
    setState(prev => ({
      ...prev,
      defaultSchedule: updatedSchedule,
      schedules: prev.schedules.map(s => 
        s.id === 'default' ? updatedSchedule : s
      )
    }));
    
    toast({
      title: 'Default schedule updated',
      description: 'The default work schedule has been updated successfully',
    });
  };

  // Create a new schedule
  const createSchedule = (schedule: WorkSchedule) => {
    if (!schedule.id) {
      schedule.id = `schedule-${Date.now()}`;
    }
    
    setState(prev => ({
      ...prev,
      schedules: [...prev.schedules, { ...schedule, isDefault: false }]
    }));
    
    toast({
      title: 'Schedule created',
      description: `"${schedule.name}" has been created successfully`,
    });
  };

  // Update an existing schedule
  const updateSchedule = (scheduleId: string, updates: Partial<WorkSchedule>) => {
    setState(prev => {
      const updatedSchedules = prev.schedules.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, ...updates } 
          : schedule
      );
      
      return {
        ...prev,
        schedules: updatedSchedules,
        defaultSchedule: scheduleId === 'default' 
          ? { ...prev.defaultSchedule, ...updates }
          : prev.defaultSchedule
      };
    });
    
    toast({
      title: 'Schedule updated',
      description: `Schedule has been updated successfully`,
    });
  };

  // Delete a schedule
  const deleteSchedule = (scheduleId: string) => {
    if (scheduleId === 'default') {
      toast({
        title: 'Cannot delete default schedule',
        description: 'The default schedule cannot be deleted',
        variant: 'destructive',
      });
      return;
    }
    
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== scheduleId),
    }));
    
    toast({
      title: 'Schedule deleted',
      description: 'The schedule has been deleted successfully',
    });
  };

  // Get a schedule by ID
  const getScheduleById = (scheduleId: string): WorkSchedule | undefined => {
    return state.schedules.find(s => s.id === scheduleId);
  };

  // Get all available schedules
  const getAllSchedules = () => state.schedules;

  return {
    updateDefaultSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getAllSchedules
  };
};
