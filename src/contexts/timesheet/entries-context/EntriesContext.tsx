
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryContext } from './TimeEntryContext';

/**
 * @deprecated Use TimeEntryContext instead
 * This is a compatibility layer for legacy code using the old EntriesContext
 * It wraps the unified TimeEntryContext and provides the same interface
 */
export interface EntriesContextValue {
  entries: TimeEntry[];
  isLoading: boolean;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => Promise<boolean>;
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date, userId?: string) => TimeEntry[];
}

export const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

/**
 * @deprecated Use TimeEntryProvider instead
 * Provider that wraps TimeEntryContext and exposes it through the old interface
 */
export const EntriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Initializing EntriesProvider compatibility layer");
  
  try {
    // Use the unified context
    const timeEntryContext = useTimeEntryContext();
    
    // Map to the old interface
    const value: EntriesContextValue = {
      entries: timeEntryContext.entries,
      isLoading: timeEntryContext.isLoading,
      createEntry: timeEntryContext.createEntry,
      updateEntry: timeEntryContext.updateEntry,
      deleteEntry: timeEntryContext.deleteEntry,
      getDayEntries: (date: Date) => timeEntryContext.getDayEntries(date),
      getMonthEntries: (date: Date, userId?: string) => timeEntryContext.getMonthEntries(date, userId || ''),
    };
    
    return (
      <EntriesContext.Provider value={value}>
        {children}
      </EntriesContext.Provider>
    );
  } catch (error) {
    console.error("Error initializing EntriesProvider compatibility layer:", error);
    
    // Provide fallback values if timeEntryContext is not available
    const fallbackValue: EntriesContextValue = {
      entries: [],
      isLoading: false,
      createEntry: () => null,
      updateEntry: () => {},
      deleteEntry: async () => false,
      getDayEntries: () => [],
      getMonthEntries: () => [],
    };
    
    return (
      <EntriesContext.Provider value={fallbackValue}>
        {children}
      </EntriesContext.Provider>
    );
  }
};

/**
 * @deprecated Use useTimeEntryContext instead
 * Hook for accessing the EntriesContext
 */
export const useEntriesContext = (): EntriesContextValue => {
  const ctx = useContext(EntriesContext);
  
  // If no context is available, try to delegate to the unified context directly
  if (!ctx) {
    console.warn("EntriesContext not found, attempting to use TimeEntryContext directly");
    
    try {
      // Create adapter wrapper when using the unified context directly
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
    } catch (error) {
      console.error("Failed to use TimeEntryContext directly:", error);
      
      // Last resort fallback
      return {
        entries: [],
        isLoading: false,
        createEntry: () => {
          console.error("Entries context not available");
          return null;
        },
        updateEntry: () => {
          console.error("Entries context not available");
        },
        deleteEntry: async () => {
          console.error("Entries context not available");
          return false;
        },
        getDayEntries: () => [],
        getMonthEntries: () => [],
      };
    }
  }
  
  return ctx;
};
