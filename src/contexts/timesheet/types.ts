
import { TimeEntry, User, WorkSchedule } from "@/types";

// Calendar context types
export interface CalendarContextType {
  currentMonth: Date;
  selectedDay: Date | null;
  prevMonth: () => void;
  nextMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date | null) => void;
}

// User timesheet context types
export interface UserTimesheetContextType {
  viewedUser: User | null;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
  isViewingOtherUser: boolean;
  workSchedule: WorkSchedule | undefined;
}

// Entries context types
export interface EntriesContextType {
  entries: TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
  getDayEntries: (date: Date, userId?: string) => TimeEntry[];
  createEntry: (entryData: Omit<TimeEntry, "id">) => string | null;
  deleteEntry: (entryId: string) => boolean;
}

// UI context types
export interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showHelpPanel: boolean;
  setShowHelpPanel: (show: boolean) => void;
}
