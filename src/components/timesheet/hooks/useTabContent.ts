
import { useMemo } from 'react';
import { TimeEntry, WorkSchedule, User } from "@/types";
import { isSameMonth, parseISO } from 'date-fns';
import { ensureDate, formatDateForComparison } from '@/utils/time/validation';

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
  
  // Filter entries for the current month with improved date handling
  const currentMonthEntries = useMemo(() => 
    entries.filter(entry => {
      const entryDate = ensureDate(entry.date);
      if (!entryDate) {
        console.warn(`[useTabContent] Invalid date found in entry, skipping:`, entry);
        return false;
      }
      
      return isSameMonth(entryDate, currentMonth);
    })
  , [entries, currentMonth]);
  
  // Log entries count for debugging
  console.debug(`[useTabContent] Filtered ${currentMonthEntries.length} entries for ${formatDateForComparison(currentMonth)}`);
  
  return {
    sortedEntries,
    currentMonthEntries
  };
};
