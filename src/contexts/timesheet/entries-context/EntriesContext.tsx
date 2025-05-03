
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
  getMonthEntries: (date: Date, userId?: string) => TimeEntry[]; // Updated to match the function signature
}

export const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

// Provider that wraps TimeEntryContext and exposes it through the old interface
export const EntriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the new context
  const timeEntryContext = useTimeEntryContext();
  
  // Create adapter functions to ensure signature compatibility
  const getDayEntriesAdapter = (date: Date) => {
    return timeEntryContext.getDayEntries(date);
  };
  
  const getMonthEntriesAdapter = (date: Date, userId?: string) => {
    return timeEntryContext.getMonthEntries(date, userId || '');
  };
  
  // Map to the old interface
  const value: EntriesContextValue = {
    entries: timeEntryContext.entries,
    isLoading: timeEntryContext.isLoading,
    createEntry: timeEntryContext.createEntry,
    updateEntry: timeEntryContext.updateEntry,
    deleteEntry: timeEntryContext.deleteEntry,
    getDayEntries: getDayEntriesAdapter,
    getMonthEntries: getMonthEntriesAdapter,
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
    // Create adapter wrapper when using the new context directly
    const timeEntryContext = useTimeEntryContext();
    
    return {
      entries: timeEntryContext.entries,
      isLoading: timeEntryContext.isLoading,
      createEntry: timeEntryContext.createEntry,
      updateEntry: timeEntryContext.updateEntry,
      deleteEntry: timeEntryContext.deleteEntry,
      getDayEntries: (date: Date) => timeEntryContext.getDayEntries(date),
      getMonthEntries: (date: Date, userId?: string) => timeEntryContext.getMonthEntries(date, userId || ''),
    };
  }
  
  return ctx;
};
