
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';
import { TimeEntryContextValue } from './types';

// Exposes only the data (NOT operations)
export interface EntryDataContextValue {
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  isLoading: boolean;
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date) => TimeEntry[];
  calculateTotalHours: (entries: TimeEntry[]) => number;
}

export const EntryDataContext = createContext<EntryDataContextValue | undefined>(undefined);

export const useEntryDataContext = (): EntryDataContextValue => {
  const ctx = useContext(EntryDataContext);
  if (!ctx) throw new Error('useEntryDataContext must be used within an EntryDataContext.Provider');
  return ctx;
};
