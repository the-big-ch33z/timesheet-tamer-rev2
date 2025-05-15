
import { TimeEntry, WorkSchedule } from '@/types';
import { UseTimeEntryFormReturn } from './timeEntryTypes';
import { WorkHoursData, BreakConfig } from '@/contexts/timesheet/types';

/**
 * Options interface for the useWorkHours hook
 */
export interface UseWorkHoursOptions {
  userId?: string;
  date?: Date;
  entries?: TimeEntry[];
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  formHandlers?: UseTimeEntryFormReturn[];
  onHoursChange?: (hours: number) => void;
  getWorkHoursForDate?: (date: Date, userId?: string) => { startTime: string, endTime: string, hasData?: boolean };
  resetWorkHoursForDate?: (date: Date, userId?: string) => void;
  refreshWorkHours?: (date?: Date | string, userId?: string) => void;
}

/**
 * Return type for the useWorkHours hook
 */
export interface UseWorkHoursReturn {
  // Basic state
  startTime: string;
  endTime: string;
  calculatedHours: number;
  
  // Time entry states
  totalEnteredHours: number;
  hasEntries: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  
  // Action states
  actionStates: {
    leave: boolean;
    sick: boolean;
    toil: boolean;
    lunch: boolean;
    smoko: boolean;
  };
  
  // Handlers
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
  handleToggleAction: (type: string, scheduledHours: number) => void;
  
  // Core work hours API
  getWorkHoursForDate: (date: Date, userId?: string) => WorkHoursData & { calculatedHours: number };
  saveWorkHoursForDate: (date: Date, startTime: string, endTime: string, userId?: string) => void;
  resetWorkHours: (date: Date, userId?: string) => void;
  refreshWorkHours: (date?: Date, userId?: string) => void;
  
  // Calculation methods
  calculateAutoHours: (startTime: string, endTime: string) => number;
  calculateDayHours: (date?: Date) => number;
  
  // Utils
  hasCustomHours: (date: Date, userId?: string) => boolean;
  clearAllWorkHours: (userId?: string) => void;
}
