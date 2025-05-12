/**
 * Core Timesheet Context Type Definitions
 * This file provides standardized types for all timesheet-related contexts
 */

import { TimeEntry, WorkSchedule, User } from "@/types";

/**
 * Calendar Context Types
 * Manages the current month, selected day and date navigation
 * @see CalendarContext.tsx
 */
export interface CalendarContextType {
  /** The currently displayed month */
  currentMonth: Date;
  /** The currently selected day (can be null) */
  selectedDay: Date | null;
  /** Navigate to the previous month */
  prevMonth: () => void;
  /** Navigate to the next month */
  nextMonth: () => void;
  /** Handle a day being clicked in the calendar */
  handleDayClick: (day: Date) => void;
  /** Directly set the selected day */
  setSelectedDay: (day: Date | null) => void;
}

/**
 * User Timesheet Context Types
 * Manages information about the user whose timesheet is being viewed
 * @see UserTimesheetContext.tsx
 */
export interface UserTimesheetContextType {
  /** The user whose timesheet is currently being viewed */
  viewedUser: User | null;
  /** The work schedule for the viewed user, if available */
  workSchedule?: WorkSchedule;
  /** Whether the current user is viewing someone else's timesheet */
  isViewingOtherUser: boolean;
  /** Whether the current user has permission to view this timesheet */
  canViewTimesheet: boolean;
  /** Whether the current user has permission to edit this timesheet */
  canEditTimesheet: boolean;
}

/**
 * Time Entry Context Types
 * Provides access to time entries and operations to manipulate them
 * @see TimeEntryContext.tsx
 */
export interface TimeEntryContextType {
  /** All available time entries */
  entries: TimeEntry[];
  /** Time entries for the current day */
  dayEntries: TimeEntry[];
  /** Add a new time entry */
  addEntry: (entryData: Omit<TimeEntry, "id">) => void;
  /** Update an existing time entry */
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => void;
  /** Delete a time entry */
  deleteEntry: (entryId: string) => Promise<boolean>;
  /** Calculate the total hours for a set of entries */
  calculateTotalHours: (entries?: TimeEntry[]) => number;
  /** Create a new time entry */
  createEntry: (entryData: Omit<TimeEntry, "id">) => string | null;
  /** Whether entries are currently loading */
  isLoading: boolean;
  /** Get entries for a specific day */
  getDayEntries: (date: Date, userId?: string) => TimeEntry[];
  /** Get entries for a specific month */
  getMonthEntries: (month: Date, userId: string) => TimeEntry[];
}

/**
 * Timesheet UI Context Types
 * Manages UI state for the timesheet
 * @see TimesheetUIContext.tsx
 */
export interface TimesheetUIContextType {
  /** The currently active tab */
  activeTab: string;
  /** Set the active tab */
  setActiveTab: (tab: string) => void;
  /** Whether to show the help panel */
  showHelpPanel: boolean;
  /** Set whether to show the help panel */
  setShowHelpPanel: (show: boolean) => void;
}

/**
 * Unified Timesheet Context Type
 * Combines all timesheet contexts into a single interface
 * @see TimesheetContext.tsx
 */
export interface UnifiedTimesheetContextType extends 
  CalendarContextType,
  UserTimesheetContextType,
  TimesheetUIContextType {
  /** The target user ID (derived from params or current user) */
  targetUserId?: string;
  /** Time entries for the current view */
  entries?: TimeEntry[];
  /** Whether entries are currently loading */
  entriesLoading?: boolean;
  /** Any error encountered when loading entries */
  entriesError?: string | null;
  /** Whether the time entry service is ready */
  isServiceReady?: boolean;
  /** Any error state in the timesheet */
  error?: any;
}

/**
 * WorkHours Data Structure
 * Represents work hours data for a specific date and user
 */
export interface WorkHoursData {
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** ISO date string */
  date: string;
  /** User ID */
  userId: string;
  /** Whether these hours are custom or derived from a schedule */
  isCustom: boolean;
  /** Timestamp for sync conflict resolution */
  lastModified: number;
}

/**
 * WorkHours Context Type
 * Provides access to work hours data and operations to manipulate them
 * @see WorkHoursContext.tsx
 */
export interface WorkHoursContextType {
  /** Get work hours for a specific date and user */
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  /** Save work hours for a specific date and user */
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  /** Clear all work hours for a user */
  clearWorkHours: (userId: string) => void;
  /** Check if a date has custom work hours */
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  /** Reset work hours for a specific day */
  resetDayWorkHours: (date: Date, userId: string) => void;
  /** Refresh times for a specific date */
  refreshTimesForDate: (date: Date, userId: string) => void;
  /** Synchronize work hours from remote data - updated signature */
  synchronizeFromRemote: (userId: string) => Promise<void>;
  /** Get default work hours from schedule */
  getDefaultScheduleHours: (date: Date, userId: string) => { startTime: string; endTime: string };
  
  /** Enhanced API for getting work hours */
  getWorkHoursForDate?: (date: Date, userId: string) => { 
    startTime: string; 
    endTime: string; 
    isCustom?: boolean; 
    hasData?: boolean 
  };
  /** Enhanced API for saving work hours */
  saveWorkHoursForDate?: (date: Date, startTime: string, endTime: string, userId: string) => void;
}
