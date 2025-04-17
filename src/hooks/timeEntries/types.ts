
import { TimeEntry } from '@/types';

export interface UseUnifiedTimeEntriesOptions {
  userId?: string;
  date?: Date;
  showToasts?: boolean;
}

export interface UnifiedTimeEntriesState {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface UnifiedTimeEntriesActions {
  createEntry: (entryData: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => boolean;
  deleteEntry: (entryId: string) => boolean;
  refreshEntries: () => void;
}

export interface UnifiedTimeEntriesQueries {
  getDayEntries: (day: Date, userIdOverride?: string) => TimeEntry[];
  getMonthEntries: (month: Date, userIdOverride?: string) => TimeEntry[];
  calculateTotalHours: (entriesToCalculate?: TimeEntry[]) => number;
}

export interface UnifiedTimeEntriesResult extends 
  UnifiedTimeEntriesState, 
  UnifiedTimeEntriesActions,
  UnifiedTimeEntriesQueries {}
