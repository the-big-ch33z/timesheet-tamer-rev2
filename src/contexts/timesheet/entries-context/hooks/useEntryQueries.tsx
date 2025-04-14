
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { areSameDates, formatDateForComparison, ensureDate } from "@/utils/time/validation";

/**
 * Hook that provides query functions for time entries
 */
export const useEntryQueries = (entries: TimeEntry[], userId?: string) => {
  // Filter entries for a specific user
  const getDayEntries = useCallback((selectedDay: Date | null) => {
    if (!selectedDay || !userId) {
      console.debug("[TimeEntryProvider] No selectedDay or userId, returning empty dayEntries");
      return [];
    }
    
    const validSelectedDate = selectedDay;
    console.debug("[TimeEntryProvider] Filtering entries for date:", 
      formatDateForComparison(validSelectedDate), 
      "userId:", userId);
    
    const filtered = entries.filter(entry => {
      // Ensure entry.date is a valid Date
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) {
        console.warn('[TimeEntryProvider] Invalid date in entry during filtering:', entry);
        return false;
      }
      
      const matches = areSameDates(entryDate, validSelectedDate) && entry.userId === userId;
      
      if (matches) {
        console.debug("[TimeEntryProvider] Matched entry:", entry.id, "hours:", entry.hours);
      }
      
      return matches;
    });
    
    console.debug("[TimeEntryProvider] Found", filtered.length, "entries for date", 
      formatDateForComparison(validSelectedDate));
    return filtered;
  }, [entries, userId]);

  // Calculate total hours for a set of entries
  const calculateTotalHours = useCallback((entriesList?: TimeEntry[]) => {
    const entriesToCalculate = entriesList || entries;
    const total = entriesToCalculate.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    console.debug("[TimeEntryProvider] Calculated total hours:", total);
    return total;
  }, [entries]);

  return {
    getDayEntries,
    calculateTotalHours
  };
};
