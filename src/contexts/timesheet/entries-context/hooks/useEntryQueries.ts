
import { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Hook to provide query functions for entries
 */
export const useEntryQueries = (entries: TimeEntry[], userId?: string) => {
  // Get entries for a specific day
  const getDayEntries = useCallback((day: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      console.warn('[useEntryQueries] No user ID provided for getDayEntries');
      return [];
    }
    
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return (
        entry.userId === targetUserId && 
        isSameDay(entryDate, day)
      );
    });
  }, [entries, userId]);
  
  // Get entries for a specific month
  const getMonthEntries = useCallback((month: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      console.warn('[useEntryQueries] No user ID provided for getMonthEntries');
      return [];
    }
    
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return (
        entry.userId === targetUserId && 
        entryDate >= firstDay && 
        entryDate <= lastDay
      );
    });
  }, [entries, userId]);
  
  // Calculate total hours from a list of entries
  const calculateTotalHours = useCallback((entriesToCalculate?: TimeEntry[]): number => {
    const entriesToUse = entriesToCalculate || entries;
    
    return entriesToUse.reduce((total, entry) => {
      return total + (typeof entry.hours === 'number' ? entry.hours : 0);
    }, 0);
  }, [entries]);
  
  return {
    getDayEntries,
    getMonthEntries,
    calculateTotalHours
  };
};
