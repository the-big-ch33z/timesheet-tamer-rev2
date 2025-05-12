
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

export interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string;
  userId: string;
  isCustom?: boolean;
  lastModified?: number;
}

export interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
  refreshTimesForDate: (date: Date, userId: string) => void;
  synchronizeFromRemote: (userId: string) => Promise<void>;  // Updated signature
  getDefaultScheduleHours: (date: Date, userId: string) => { startTime: string; endTime: string }; 
  
  // Enhanced API methods
  getWorkHoursForDate: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom?: boolean; hasData?: boolean };
  saveWorkHoursForDate: (date: Date, startTime: string, endTime: string, userId: string) => void;
}
