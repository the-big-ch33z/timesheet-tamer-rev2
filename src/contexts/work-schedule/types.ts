
import { WorkSchedule } from '@/types';

export interface WorkScheduleContextType {
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
  verifyUserScheduleConsistency: () => { 
    consistent: boolean; 
    issues: { userId: string; userName: string; issue: string }[] 
  };
}

// Local storage keys
export const SCHEDULES_STORAGE_KEY = 'timesheet-app-schedules';
export const USER_SCHEDULES_STORAGE_KEY = 'timesheet-app-user-schedules';
