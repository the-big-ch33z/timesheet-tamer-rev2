
import { User, TimeEntry, WorkSchedule } from "@/types";
import { TimeEntryFormState } from "@/hooks/timesheet/types/timeEntryTypes";

export interface CalendarContextType {
  currentMonth: Date;
  selectedDay: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  setSelectedDay: (day: Date) => void;
  handleDayClick: (day: Date) => void;
}

export interface EntriesContextType {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  refreshEntries: () => void;
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => TimeEntry | null;
  deleteEntry: (id: string) => boolean;
}

// Unified WorkHoursData interface - the single source of truth
export interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string; // ISO date string
  userId: string;
  isCustom: boolean; // Flag to indicate this is a custom override
  lastModified: number; // Timestamp for sync conflict resolution
  hasData?: boolean;
}

// Consolidated WorkHoursContextType - the unified interface
export interface WorkHoursContextType {
  // Core methods
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
  refreshTimesForDate: (date: Date, userId: string) => void;
  
  // Schedule integration
  getDefaultScheduleHours: (date: Date, userId: string) => { startTime: string; endTime: string };
  
  // Remote sync functionality
  synchronizeFromRemote: (remoteData: WorkHoursData[]) => void;
  
  // Enhanced API methods for more flexible calling patterns
  getWorkHoursForDate: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom?: boolean; hasData?: boolean };
  saveWorkHoursForDate: (date: Date, startTime: string, endTime: string, userId: string) => void;
}

// Break configuration - used by work hours components
export interface BreakConfig {
  lunch: boolean;
  smoko: boolean;
}

// Standardized work hours state
export interface WorkHoursState {
  startTime: string;
  endTime: string;
  isCustom: boolean;
  hasData?: boolean;
  calculatedHours?: number;
}
