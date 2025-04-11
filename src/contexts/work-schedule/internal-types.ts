
import { WorkSchedule } from '@/types';

// Storage operations
export interface StorageOperations {
  loadSchedules: () => WorkSchedule[];
  loadUserSchedules: () => Record<string, string>;
  saveSchedules: (schedules: WorkSchedule[]) => void;
  saveUserSchedules: (userSchedules: Record<string, string>) => void;
}

// State interfaces for cleaner code organization
export interface WorkScheduleState {
  defaultSchedule: WorkSchedule;
  schedules: WorkSchedule[];
  userSchedules: Record<string, string>; // userId -> scheduleId
}
