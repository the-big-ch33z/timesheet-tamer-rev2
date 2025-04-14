
import { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { formatDateForComparison, areSameDates, ensureDate } from '@/utils/time/validation';

/**
 * Hook that provides query functions for time entries
 */
export const useEntryQueries = (
  entries: TimeEntry[],
  userId?: string
) => {
  // Calculate total hours for a list of entries
  const calculateTotalHours = useCallback((entriesToCalculate?: TimeEntry[]) => {
    const entriesToUse = entriesToCalculate || entries;
    return entriesToUse.reduce((total, entry) => total + (entry.hours || 0), 0);
  }, [entries]);

  // Get entries for a specific day
  const getDayEntries = useCallback((day: Date, userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) return [];
    
    console.debug(`Getting day entries for ${day.toDateString()} and user ${targetUserId}`);
    
    return entries.filter(entry => {
      // First filter by user ID
      if (entry.userId !== targetUserId) return false;
      
      // Then filter by date
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) return false;
      
      return areSameDates(entryDate, day);
    });
  }, [entries, userId]);

  // Get entries for a specific user
  const getUserEntries = useCallback((userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) return [];
    
    return entries.filter(entry => entry.userId === targetUserId);
  }, [entries, userId]);

  return {
    calculateTotalHours,
    getDayEntries,
    getUserEntries
  };
};
