
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkSchedule, WeekDay } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Default work schedule
const defaultWorkSchedule: WorkSchedule = {
  id: 'default',
  name: 'Default Schedule',
  workDays: {
    monday: { startTime: '09:00', endTime: '17:00' },
    tuesday: { startTime: '09:00', endTime: '17:00' },
    wednesday: { startTime: '09:00', endTime: '17:00' },
    thursday: { startTime: '09:00', endTime: '17:00' },
    friday: { startTime: '09:00', endTime: '17:00' },
    saturday: null,
    sunday: null
  },
  rdoDays: [],
  isDefault: true
};

interface WorkScheduleContextType {
  defaultSchedule: WorkSchedule;
  userSchedules: Record<string, WorkSchedule>; // userId -> WorkSchedule
  updateDefaultSchedule: (schedule: WorkSchedule) => void;
  updateUserSchedule: (userId: string, schedule: WorkSchedule) => void;
  getUserSchedule: (userId: string) => WorkSchedule;
  resetUserSchedule: (userId: string) => void;
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
  const [userSchedules, setUserSchedules] = useState<Record<string, WorkSchedule>>({});

  const updateDefaultSchedule = (schedule: WorkSchedule) => {
    setDefaultSchedule({ ...schedule, isDefault: true });
    toast({
      title: 'Default schedule updated',
      description: 'The default work schedule has been updated successfully',
    });
  };

  const updateUserSchedule = (userId: string, schedule: WorkSchedule) => {
    setUserSchedules(prev => ({
      ...prev,
      [userId]: { ...schedule, isDefault: false }
    }));
    toast({
      title: 'User schedule updated',
      description: `Work schedule for this user has been updated successfully`,
    });
  };

  const getUserSchedule = (userId: string): WorkSchedule => {
    return userSchedules[userId] || defaultSchedule;
  };

  const resetUserSchedule = (userId: string) => {
    const newUserSchedules = { ...userSchedules };
    delete newUserSchedules[userId];
    setUserSchedules(newUserSchedules);
    toast({
      title: 'Schedule reset',
      description: 'User will now use the default work schedule',
    });
  };

  return (
    <WorkScheduleContext.Provider value={{
      defaultSchedule,
      userSchedules,
      updateDefaultSchedule,
      updateUserSchedule,
      getUserSchedule,
      resetUserSchedule
    }}>
      {children}
    </WorkScheduleContext.Provider>
  );
};
