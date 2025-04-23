
import React, { createContext, useEffect } from 'react';
import { TimeEntryContextValue, TimeEntryProviderProps } from './types';
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';
import { createTimeLogger } from '@/utils/time/errors';
import { EntryDataContext } from './EntryDataContext';
import { EntryOperationsContext } from './EntryOperationsContext';

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
  useStorageSync(entries, isInitialized, isLoading);
  const { addEntry, updateEntry, deleteEntry, createEntry } = useEntryOperations(entries, setEntries);
  const { getDayEntries, getMonthEntries, calculateTotalHours } = useEntryQueries(entries, userId);
  const dayEntries = selectedDate ? getDayEntries(selectedDate) : [];
  
  // Log when selectedDate changes to track updates
  useEffect(() => {
    if (selectedDate) {
      logger.debug(`Selected date in TimeEntryProvider: ${selectedDate.toISOString()}, entries: ${dayEntries.length}`);
    }
  }, [selectedDate, dayEntries.length]);

  // Split value for the two new contexts
  const dataValue = {
    entries,
    dayEntries,
    isLoading,
    getDayEntries,
    getMonthEntries,
    calculateTotalHours
  };

  const operationsValue = {
    addEntry,
    updateEntry,
    deleteEntry,
    createEntry
  };

  // Wrap both context providers
  return (
    <EntryDataContext.Provider value={dataValue}>
      <EntryOperationsContext.Provider value={operationsValue}>
        {children}
      </EntryOperationsContext.Provider>
    </EntryDataContext.Provider>
  );
};
