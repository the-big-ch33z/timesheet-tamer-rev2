
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryContext } from './useTimeEntryContext';

// This is a compatibility layer for legacy code using the old EntriesContext
// It wraps the new TimeEntryContext and provides the same interface

export interface EntriesContextValue {
  entries: TimeEntry[];
  isLoading: boolean;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => Promise<boolean>;
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date) => TimeEntry[];
}

export const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

// Provider that wraps TimeEntryContext and exposes it through the old interface
export const EntriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the new context
  const timeEntryContext = useTimeEntryContext();
  
  // Map to the old interface
  const value: EntriesContextValue = {
    entries: timeEntryContext.entries,
    isLoading: timeEntryContext.isLoading,
    createEntry: timeEntryContext.createEntry,
    updateEntry: timeEntryContext.updateEntry,
    deleteEntry: timeEntryContext.deleteEntry,
    getDayEntries: timeEntryContext.getDayEntries,
    getMonthEntries: timeEntryContext.getMonthEntries,
  };
  
  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
};

// Hook for accessing the EntriesContext
export const useEntriesContext = (): EntriesContextValue => {
  const ctx = useContext(EntriesContext);
  
  // If no context is available, delegate to the new context directly
  if (!ctx) {
    return useTimeEntryContext();
  }
  
  return ctx;
};
