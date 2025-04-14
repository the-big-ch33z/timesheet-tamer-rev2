
import { TimeEntry } from "@/types";

export interface TimeEntryContextValue {
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  addEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (entryId: string) => void;
  calculateTotalHours: (entriesList?: TimeEntry[]) => number;
  isLoading: boolean;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  getDayEntries: (date: Date) => TimeEntry[];
}

export interface TimeEntryProviderProps {
  children: React.ReactNode;
  selectedDate: Date;
  userId?: string;
}
