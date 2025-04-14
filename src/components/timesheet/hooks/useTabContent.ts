
import { useMemo } from 'react';
import { TimeEntry, WorkSchedule, User } from "@/types";
import { isSameMonth, parseISO } from 'date-fns';
import { ensureDate } from '@/utils/time/validation';

export interface TabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  user?: User;
  workSchedule?: WorkSchedule;
}

export const useTabContent = ({ entries, currentMonth }: TabContentProps) => {
  // Memoize sorted entries to prevent unnecessary sorting on each render
  const sortedEntries = useMemo(() => 
    [...entries].sort((a, b) => {
      const dateA = ensureDate(a.date) || new Date();
      const dateB = ensureDate(b.date) || new Date();
      return dateB.getTime() - dateA.getTime();
    })
  , [entries]);
  
  // Filter entries for the current month
  const currentMonthEntries = useMemo(() => 
    entries.filter(entry => {
      const entryDate = ensureDate(entry.date);
      if (!entryDate) return false;
      
      return isSameMonth(entryDate, currentMonth);
    })
  , [entries, currentMonth]);
  
  return {
    sortedEntries,
    currentMonthEntries
  };
};
