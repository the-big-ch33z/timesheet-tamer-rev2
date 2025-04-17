
import { TimeEntry, WorkSchedule, User } from "@/types";

// Calendar Context Types
export interface CalendarContextType {
  currentMonth: Date;
  selectedDay: Date | null;
  prevMonth: () => void;
  nextMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date | null) => void;
}

// User Timesheet Context Types
export interface UserTimesheetContextType {
  viewedUser: User | null;
  workSchedule?: WorkSchedule;
  isViewingOtherUser: boolean;
  canViewTimesheet: boolean;
  canEditTimesheet: boolean;
}

// Entries Context Types
export interface EntriesContextType {
  entries: TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
  getDayEntries: (day: Date, userId?: string) => TimeEntry[];
  createEntry: (entryData: Omit<TimeEntry, "id">) => void;
  deleteEntry: (entryId: string) => Promise<boolean>;
}

// Timesheet UI Context Types
export interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showHelpPanel: boolean;
  setShowHelpPanel: (show: boolean) => void;
}
