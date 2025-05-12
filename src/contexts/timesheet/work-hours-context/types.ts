
import { WorkHoursData } from '../types';

// Define the data structure for storing work hours
export type { WorkHoursData };

export interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
  refreshTimesForDate: (date: Date, userId: string) => void;
  synchronizeFromRemote?: (remoteData: WorkHoursData[]) => void;
  getDefaultScheduleHours?: (date: Date, userId: string) => { startTime: string; endTime: string };
  
  // Add the methods being used in useTimeEntryState
  getWorkHoursForDate?: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom?: boolean; hasData?: boolean; calculatedHours?: number };
  saveWorkHoursForDate?: (date: Date, startTime: string, endTime: string, userId: string) => void;
}
