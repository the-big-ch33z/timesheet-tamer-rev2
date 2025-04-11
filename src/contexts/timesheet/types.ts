
import { TimeEntry, WorkSchedule, User } from "@/types";

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
  addEntry: (entry: Omit<TimeEntry, "id">) => TimeEntry;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updatedEntry: Partial<TimeEntry>) => void;
  getUserEntries: () => TimeEntry[];
  getDayEntries: (day: Date) => TimeEntry[];
}
