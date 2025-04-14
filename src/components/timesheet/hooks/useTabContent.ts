
import { useMemo } from 'react';
import { TimeEntry, User, WorkSchedule } from '@/types';
import { isAfter } from 'date-fns';
import { calculateAdjustedFortnightHours } from '@/utils/time/calculations';

interface UseTabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  workSchedule?: WorkSchedule;
  user?: User;
}

export const useTabContent = ({
  entries,
  currentMonth,
  workSchedule,
  user
}: UseTabContentProps) => {
  // Sort entries for the Recent tab - most recent first
  const sortedEntries = useMemo(() => {
    const entriesToSort = [...entries];
    
    // Sort by date, most recent first
    return entriesToSort.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      
      // Most recent first
      return isAfter(dateA, dateB) ? -1 : 1;
    });
  }, [entries]);
  
  // Calculate monthly hours - this is just for reference, not being modified
  const monthlyHours = useMemo(() => {
    // Filter entries for the current month
    const monthEntries = entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.getMonth() === currentMonth.getMonth() && 
             entryDate.getFullYear() === currentMonth.getFullYear();
    });
    
    // Calculate total hours
    const totalHours = monthEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    
    // Calculate target hours if we have the necessary data
    let targetHours = 0;
    if (user && workSchedule) {
      const fte = user.fte || 1;
      const fortnightHours = user.fortnightHours || calculateAdjustedFortnightHours(workSchedule, fte);
      targetHours = (fortnightHours * 2.17); // Approximation for month
    }
    
    return {
      total: totalHours,
      target: targetHours,
      variance: totalHours - targetHours
    };
  }, [entries, currentMonth, user, workSchedule]);
  
  return {
    sortedEntries,
    monthlyHours
  };
};
