
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useTimesheetEntries } from '@/hooks/timesheet/useTimesheetEntries';
import { TimeEntry } from '@/types';
import { EntriesContextType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const useEntriesContext = (): EntriesContextType => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntriesContext must be used within an EntriesProvider');
  }
  return context;
};

interface EntriesProviderProps {
  children: ReactNode;
  userId?: string;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children, userId }) => {
  const {
    entries,
    getUserEntries,
    getDayEntries,
    addEntry,
    deleteEntry
  } = useTimesheetEntries(userId);
  
  // Allow creating entries
  const createEntry = (entryData: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      userId: userId || '',
    };
    
    addEntry(newEntry);
  };
  
  const value: EntriesContextType = {
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
