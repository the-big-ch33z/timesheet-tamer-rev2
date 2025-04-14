
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';

// Import newly created hooks
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';

interface EntriesContextValue {
  entries: TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
  getDayEntries: (date: Date, userId?: string) => TimeEntry[];
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  deleteEntry: (entryId: string) => boolean;
}

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

export const useEntriesContext = () => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntriesContext must be used within an EntriesProvider');
  }
  return context;
};

interface EntriesProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children, userId }) => {
  // Load initial entries
  const { entries, setEntries, isLoading, isInitialized } = useInitialEntries();
  
  // Setup storage sync
  useStorageSync(entries, isInitialized, isLoading);
  
  // Get entry operations - pass both parameters
  const { addEntry, deleteEntry, createEntry } = useEntryOperations(entries, setEntries);
  
  // Get query functions
  const { getDayEntries, getUserEntries } = useEntryQueries(entries, userId);
  
  const value = {
    entries,
    getUserEntries, 
    getDayEntries,
    createEntry,
    deleteEntry
  };
  
  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
};
