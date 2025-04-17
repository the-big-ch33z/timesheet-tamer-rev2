
import { TimeEntry } from "@/types";

export interface TimeEntryContextValue {
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  addEntry: (entryData: Omit<TimeEntry, "id">) => void;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (entryId: string) => boolean;
  calculateTotalHours: (entries?: TimeEntry[]) => number;
  createEntry: (entryData: Omit<TimeEntry, "id">) => string | null;
  isLoading: boolean;
  getDayEntries: (date: Date, userId?: string) => TimeEntry[];
  getMonthEntries: (month: Date, userId: string) => TimeEntry[];
}

export interface TimeEntryProviderProps {
  children: React.ReactNode;
  selectedDate: Date;
  userId: string;
}

export interface EntryStorageItem {
  entries: TimeEntry[];
  lastUpdated: string;
}
