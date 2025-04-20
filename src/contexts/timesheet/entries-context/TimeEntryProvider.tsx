
import React, { createContext, useEffect } from 'react';
import { TimeEntryContextValue, TimeEntryProviderProps } from './types';
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TimeEntryProvider');

// Create the context
export const TimeEntryContext = createContext<TimeEntryContextValue | undefined>(undefined);

export const TimeEntryProvider: React.FC<TimeEntryProviderProps> = ({ 
  children, 
  selectedDate, 
  userId 
}) => {
  // Load initial entries and get state management
  const { entries, setEntries, isLoading, isInitialized } = useInitialEntries();

  // Set up storage synchronization
  useStorageSync(entries, isInitialized, isLoading);

  // Get entry manipulation operations
  const { addEntry, updateEntry, deleteEntry, createEntry } = useEntryOperations(entries, setEntries);

  // Set up query functions
  const { getDayEntries, getMonthEntries, calculateTotalHours } = useEntryQueries(entries, userId);

  // Get entries for the currently selected day
  const dayEntries = selectedDate ? getDayEntries(selectedDate) : [];
  
  // Log when selectedDate changes to track updates
  useEffect(() => {
    if (selectedDate) {
      logger.debug(`Selected date in TimeEntryProvider: ${selectedDate.toISOString()}, entries: ${dayEntries.length}`);
    }
  }, [selectedDate, dayEntries.length]);

  // Prepare context value
  const value: TimeEntryContextValue = {
    entries,
    dayEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    calculateTotalHours,
    isLoading,
    createEntry,
    getDayEntries,
    getMonthEntries
  };

  return (
    <TimeEntryContext.Provider value={value}>
      {children}
    </TimeEntryContext.Provider>
  );
};
