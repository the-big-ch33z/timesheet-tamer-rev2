
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkSchedule, WeekDay } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Default work schedule with two-week rotation
const defaultWorkSchedule: WorkSchedule = {
  id: 'default',
  name: 'Default Schedule',
  weeks: {
    1: {
      monday: { startTime: '09:00', endTime: '17:00' },
      tuesday: { startTime: '09:00', endTime: '17:00' },
      wednesday: { startTime: '09:00', endTime: '17:00' },
      thursday: { startTime: '09:00', endTime: '17:00' },
      friday: { startTime: '09:00', endTime: '17:00' },
      saturday: null,
      sunday: null
    },
    2: {
      monday: { startTime: '09:00', endTime: '17:00' },
      tuesday: { startTime: '09:00', endTime: '17:00' },
      wednesday: { startTime: '09:00', endTime: '17:00' },
      thursday: { startTime: '09:00', endTime: '17:00' },
      friday: { startTime: '09:00', endTime: '17:00' },
      saturday: null,
      sunday: null
    }
  },
  rdoDays: {
    1: [],
    2: []
  },
  isDefault: true
};

interface WorkScheduleContextType {
  defaultSchedule: WorkSchedule;
  schedules: WorkSchedule[];
  userSchedules: Record<string, string>; // userId -> scheduleId
  updateDefaultSchedule: (schedule: WorkSchedule) => void;
  createSchedule: (schedule: WorkSchedule) => void;
  updateSchedule: (scheduleId: string, updates: Partial<WorkSchedule>) => void;
  deleteSchedule: (scheduleId: string) => void;
  getScheduleById: (scheduleId: string) => WorkSchedule | undefined;
  assignScheduleToUser: (userId: string, scheduleId: string) => void;
  getUserSchedule: (userId: string) => WorkSchedule;
  resetUserSchedule: (userId: string) => void;
  getAllSchedules: () => WorkSchedule[];
}

const WorkScheduleContext = createContext<WorkScheduleContextType | undefined>(undefined);

export const useWorkSchedule = (): WorkScheduleContextType => {
  const context = useContext(WorkScheduleContext);
  if (!context) {
    throw new Error('useWorkSchedule must be used within a WorkScheduleProvider');
  }
  return context;
};

export const WorkScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [defaultSchedule, setDefaultSchedule] = useState<WorkSchedule>(defaultWorkSchedule);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([defaultWorkSchedule]);
  const [userSchedules, setUserSchedules] = useState<Record<string, string>>({});

  // Update the default schedule
  const updateDefaultSchedule = (schedule: WorkSchedule) => {
    const updatedSchedule = { ...schedule, isDefault: true };
    setDefaultSchedule(updatedSchedule);
    
    // Also update in the schedules array
    setSchedules(prevSchedules => 
      prevSchedules.map(s => s.id === 'default' ? updatedSchedule : s)
    );
    
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
    
    setSchedules(prev => [...prev, { ...schedule, isDefault: false }]);
    
    toast({
      title: 'Schedule created',
      description: `"${schedule.name}" has been created successfully`,
    });
  };

  // Update an existing schedule
  const updateSchedule = (scheduleId: string, updates: Partial<WorkSchedule>) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, ...updates } 
          : schedule
      )
    );
    
    // If updating default schedule, also update defaultSchedule state
    if (scheduleId === 'default') {
      setDefaultSchedule(prev => ({ ...prev, ...updates }));
    }
    
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
    
    // Remove from schedules
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    
    // Reset any users using this schedule to default
    const affectedUsers = Object.entries(userSchedules)
      .filter(([_, sId]) => sId === scheduleId)
      .map(([userId]) => userId);
    
    if (affectedUsers.length > 0) {
      const newUserSchedules = { ...userSchedules };
      affectedUsers.forEach(userId => {
        delete newUserSchedules[userId];
      });
      setUserSchedules(newUserSchedules);
      
      toast({
        title: 'Schedule deleted',
        description: `Schedule deleted and ${affectedUsers.length} users reset to default schedule`,
      });
    } else {
      toast({
        title: 'Schedule deleted',
        description: 'The schedule has been deleted successfully',
      });
    }
  };

  // Get a schedule by ID
  const getScheduleById = (scheduleId: string): WorkSchedule | undefined => {
    return schedules.find(s => s.id === scheduleId);
  };

  // Assign a schedule to a user
  const assignScheduleToUser = (userId: string, scheduleId: string) => {
    if (scheduleId !== 'default' && !schedules.some(s => s.id === scheduleId)) {
      toast({
        title: 'Invalid schedule',
        description: 'The selected schedule does not exist',
        variant: 'destructive',
      });
      return;
    }
    
    if (scheduleId === 'default') {
      // If assigning default, just remove from userSchedules
      const newUserSchedules = { ...userSchedules };
      delete newUserSchedules[userId];
      setUserSchedules(newUserSchedules);
    } else {
      // Assign the schedule
      setUserSchedules(prev => ({
        ...prev,
        [userId]: scheduleId
      }));
    }
    
    toast({
      title: 'Schedule assigned',
      description: 'Work schedule has been assigned to the user',
    });
  };

  // Get the schedule for a user
  const getUserSchedule = (userId: string): WorkSchedule => {
    const assignedScheduleId = userSchedules[userId];
    if (!assignedScheduleId) return defaultSchedule;
    
    const assignedSchedule = schedules.find(s => s.id === assignedScheduleId);
    return assignedSchedule || defaultSchedule;
  };

  // Reset a user to the default schedule
  const resetUserSchedule = (userId: string) => {
    const newUserSchedules = { ...userSchedules };
    delete newUserSchedules[userId];
    setUserSchedules(newUserSchedules);
    
    toast({
      title: 'Schedule reset',
      description: 'User will now use the default work schedule',
    });
  };

  // Get all available schedules
  const getAllSchedules = () => schedules;

  return (
    <WorkScheduleContext.Provider value={{
      defaultSchedule,
      schedules,
      userSchedules,
      updateDefaultSchedule,
      createSchedule,
      updateSchedule,
      deleteSchedule,
      getScheduleById,
      assignScheduleToUser,
      getUserSchedule,
      resetUserSchedule,
      getAllSchedules
    }}>
      {children}
    </WorkScheduleContext.Provider>
  );
};
