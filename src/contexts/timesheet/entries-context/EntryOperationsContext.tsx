
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';

export interface EntryOperationsContextValue {
  addEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => boolean;
  deleteEntry: (id: string) => boolean;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
}

export const EntryOperationsContext = createContext<EntryOperationsContextValue | undefined>(undefined);

export const useEntryOperationsContext = (): EntryOperationsContextValue => {
  const ctx = useContext(EntryOperationsContext);
  if (!ctx) throw new Error('useEntryOperationsContext must be used within an EntryOperationsContext.Provider');
  return ctx;
};
