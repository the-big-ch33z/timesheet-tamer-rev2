
import { WorkSchedule } from '@/types';

// Define the data structure for storing work hours
export interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string; // ISO date string
  userId: string;
  isCustom: boolean; // Flag to indicate this is a custom override
  lastModified: number; // Timestamp for sync conflict resolution
}

export interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
  refreshTimesForDate: (date: Date, userId: string) => void;
  synchronizeFromRemote?: (userId: string) => Promise<void>;
  getDefaultScheduleHours: (date: Date, userId: string) => { startTime: string; endTime: string };
  
  // Add the methods being used in useTimeEntryState
  getWorkHoursForDate?: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom?: boolean; hasData?: boolean };
  saveWorkHoursForDate?: (date: Date, startTime: string, endTime: string, userId: string) => void;
}
