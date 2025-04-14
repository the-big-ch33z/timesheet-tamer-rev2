
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useTimesheetEntries } from '@/hooks/timesheet/useTimesheetEntries';
import { TimeEntry } from '@/types';
import { EntriesContextType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ensureDate, isValidDate } from '@/utils/time/validation';
import { useToast } from '@/hooks/use-toast';

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
  
  const { toast } = useToast();
  
  // Allow creating entries with validation
  const createEntry = (entryData: Omit<TimeEntry, "id">) => {
    console.debug('[EntriesContext] Creating new entry:', entryData);
    
    // Validate date
    if (!entryData.date || !isValidDate(entryData.date)) {
      console.error('[EntriesContext] Invalid date in entry data:', entryData.date);
      toast({
        title: "Error creating entry",
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return;
    }
    
    const validDate = ensureDate(entryData.date);
    if (!validDate) {
      console.error('[EntriesContext] Failed to convert date:', entryData.date);
      toast({
        title: "Error creating entry",
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return;
    }
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      userId: userId || '',
      date: validDate
    };
    
    console.debug('[EntriesContext] Adding validated entry:', newEntry);
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
