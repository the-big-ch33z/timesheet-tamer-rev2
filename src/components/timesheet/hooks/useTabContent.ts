
import { useMemo } from 'react';
import { TimeEntry, WorkSchedule, User } from "@/types";
import { isSameMonth } from 'date-fns';

export interface TabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  user?: User;
  workSchedule?: WorkSchedule;
}

export const useTabContent = ({ entries, currentMonth }: TabContentProps) => {
  // Memoize sorted entries to prevent unnecessary sorting on each render
  const sortedEntries = useMemo(() => 
    [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  , [entries]);
  
  // Filter entries for the current month
  const currentMonthEntries = useMemo(() => 
    entries.filter(entry => isSameMonth(new Date(entry.date), currentMonth))
  , [entries, currentMonth]);
  
  return {
    sortedEntries,
    currentMonthEntries
  };
};
