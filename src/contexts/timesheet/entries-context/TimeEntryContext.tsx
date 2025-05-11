
import React, { createContext, useContext, ReactNode } from 'react';
import { TimeEntry } from '@/types';
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';
import { createTimeLogger } from '@/utils/time/errors';
import { TOILEventProvider } from '@/utils/time/events/toilEventService';
import { TimeEntryContextType } from '../types';

const logger = createTimeLogger('TimeEntryContext');

export interface TimeEntryProviderProps {
  children: ReactNode;
  selectedDate?: Date | null;
  userId?: string;
}

// Create the context
export const TimeEntryContext = createContext<TimeEntryContextType | undefined>(undefined);

/**
 * TimeEntryProvider
 * 
 * Provides access to time entries and operations to manipulate them
 * 
 * @dependency None - This is a root-level context that doesn't depend on other contexts
 * 
 * Dependencies Flow:
 * - Other contexts may depend on TimeEntryContext
 * - This context uses services directly without requiring other contexts
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
  const contextValue: TimeEntryContextType = {
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
 * useTimeEntryContext
 * 
 * Hook to access time entry data and operations
 * 
 * @returns {TimeEntryContextType} Time entry context value
 * @throws {Error} If used outside of a TimeEntryProvider
 */
export const useTimeEntryContext = (): TimeEntryContextType => {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  return context;
};
