
import React, { createContext, useContext, ReactNode } from 'react';
import { TimeEntry } from '@/types';
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';
import { createTimeLogger } from '@/utils/time/errors';
import { TOILEventProvider } from '@/utils/time/events/toilEventService';

const logger = createTimeLogger('TimeEntryContext');

/**
 * Unified TimeEntryContext that combines data and operations
 * This eliminates the need for separate EntryDataContext and EntryOperationsContext
 */
export interface TimeEntryContextValue {
  // Data state
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  isLoading: boolean;
  
  // Queries
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date, userIdOverride?: string) => TimeEntry[];
  calculateTotalHours: (entries?: TimeEntry[]) => number;
  
  // Operations
  addEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => Promise<boolean>;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
}

export interface TimeEntryProviderProps {
  children: ReactNode;
  selectedDate?: Date | null;
  userId?: string;
}

// Create the context
export const TimeEntryContext = createContext<TimeEntryContextValue | undefined>(undefined);

/**
 * Unified TimeEntryProvider that combines data and operations
 * This replaces the previous pattern of nesting EntryDataContext and EntryOperationsContext
 */
export const TimeEntryProvider: React.FC<TimeEntryProviderProps> = ({ 
  children, 
  selectedDate, 
  userId 
}) => {
  // Load initial entries and get state management
  const { entries, setEntries, isLoading, isInitialized } = useInitialEntries();
  
  // Set up storage synchronization
  useStorageSync(entries, isInitialized, isLoading);
  
  // Set up operations and queries
  const { addEntry, updateEntry, deleteEntry, createEntry } = useEntryOperations(entries, setEntries);
  const { getDayEntries, getMonthEntries, calculateTotalHours } = useEntryQueries(entries, userId);
  
  // Get entries for the current day
  const dayEntries = selectedDate ? getDayEntries(selectedDate) : [];
  
  // Log when selectedDate changes to track updates
  React.useEffect(() => {
    if (selectedDate) {
      logger.debug(`Selected date in TimeEntryProvider: ${selectedDate.toISOString()}, entries: ${dayEntries.length}`);
    }
  }, [selectedDate, dayEntries.length]);

  // Create unified context value
  const contextValue: TimeEntryContextValue = {
    // Data
    entries,
    dayEntries,
    isLoading,
    
    // Queries
    getDayEntries,
    getMonthEntries,
    calculateTotalHours,
    
    // Operations
    addEntry,
    updateEntry,
    deleteEntry,
    createEntry
  };

  // Simplified provider structure
  return (
    <TOILEventProvider>
      <TimeEntryContext.Provider value={contextValue}>
        {children}
      </TimeEntryContext.Provider>
    </TOILEventProvider>
  );
};

/**
 * Hook to access the TimeEntryContext
 * This is the main entry point for consuming time entry functionality
 */
export const useTimeEntryContext = (): TimeEntryContextValue => {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  return context;
};
