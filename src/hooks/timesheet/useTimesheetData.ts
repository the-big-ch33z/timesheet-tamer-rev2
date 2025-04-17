
import { useCallback, useMemo } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services';
import { useLogger } from '../useLogger';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';

/**
 * Unified hook for accessing and manipulating timesheet data
 * Combines functionality from various timesheet hooks
 */
export const useTimesheetData = (userId?: string) => {
  const logger = useLogger('TimesheetData');
  const { entries } = useTimeEntryContext();

  // Get entries for a specific day
  const getDayEntries = useCallback((date: Date) => {
    if (!userId || !date) return [];
    
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString() && 
             entry.userId === userId;
    });
  }, [entries, userId]);

  // Get entries for a specific month
  const getMonthEntries = useCallback((date: Date) => {
    if (!userId || !date) return [];
    
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.getMonth() === date.getMonth() && 
             entryDate.getFullYear() === date.getFullYear() &&
             entry.userId === userId;
    });
  }, [entries, userId]);

  // Calculate total hours for a set of entries
  const calculateTotalHours = useCallback((entriesToCalculate: TimeEntry[]) => {
    return unifiedTimeEntryService.calculateTotalHours(entriesToCalculate);
  }, []);

  // Get all entries for the current user
  const userEntries = useMemo(() => {
    if (!userId) return [];
    return entries.filter(entry => entry.userId === userId);
  }, [entries, userId]);

  return {
    entries: userEntries,
    getDayEntries,
    getMonthEntries,
    calculateTotalHours
  };
};
