
import { TimeEntry, WorkSchedule, User } from "@/types";

// Context-specific types
export interface TimesheetContextType {
  // User and permissions
  targetUserId?: string;
  viewedUser?: User;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  
  // Calendar and timesheet data
  currentMonth: Date;
  selectedDay: Date | null;
  workSchedule?: WorkSchedule;
  entries: TimeEntry[];
  
  // Tab state
  activeTab: string;
  
  // Actions
  setActiveTab: (tab: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date | null) => void;
  
  // Entry operations
  getUserEntries: () => TimeEntry[];
  getDayEntries: (day: Date) => TimeEntry[];
  createEntry: (entry: Omit<TimeEntry, "id">) => void;
}

// UI Context
export interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Calendar Context
export interface CalendarContextType {
  currentMonth: Date;
  selectedDay: Date | null;
  prevMonth: () => void;
  nextMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date | null) => void;
}

// User Context
export interface UserTimesheetContextType {
  targetUserId?: string;
  viewedUser?: User;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  workSchedule?: WorkSchedule;
}

// Entries Context
export interface EntriesContextType {
  entries: TimeEntry[];
  getUserEntries: () => TimeEntry[];
  getDayEntries: (day: Date) => TimeEntry[];
  createEntry: (entry: Omit<TimeEntry, "id">) => void;
}

// Time-related types
export interface WorkHoursResult {
  totalHours: number;
  averagePerDay: number;
  daysWithEntries: number;
  daysLogged: Date[];
}

export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  startTime: string;
  endTime: string;
  formEdited: boolean;
}

// These types can be imported directly in the respective context files
