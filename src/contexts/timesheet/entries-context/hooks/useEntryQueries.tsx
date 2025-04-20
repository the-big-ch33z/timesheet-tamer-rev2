
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { ensureDate } from "@/utils/time/validation";
import { formatDateForComparison } from "@/utils/time/formatting";
import { isSameDayConsistent, logDateComparison } from "@/utils/time/validation/dateComparison";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('useEntryQueries');

/**
 * Hook that provides query functions for time entries
 * Updated to use consistent date comparison
 */
export const useEntryQueries = (entries: TimeEntry[], userId?: string) => {
  // Filter entries for a specific user and day
  const getDayEntries = useCallback((selectedDay: Date | null) => {
    if (!selectedDay || !userId) {
      logger.debug("[useEntryQueries] No selectedDay or userId, returning empty dayEntries");
      return [];
    }
    
    logger.debug("[useEntryQueries] Filtering entries for date:", 
      formatDateForComparison(selectedDay), 
      "userId:", userId);
    
    // Log raw entries data for debugging
    logger.debug(`[useEntryQueries] Raw entries count: ${entries.length}`);
    
    const filtered = entries.filter(entry => {
      // Ensure entry.date is a valid Date
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) {
        logger.warn('[useEntryQueries] Invalid date in entry during filtering:', entry);
        return false;
      }
      
      // Use our consistent date comparison
      const dateMatches = isSameDayConsistent(entryDate, selectedDay);
      const userMatches = entry.userId === userId;
      const matches = dateMatches && userMatches;
      
      // Debug logging for tricky entries
      if (dateMatches && !userMatches) {
        logger.debug(`[useEntryQueries] Date match but user mismatch: ${entry.userId} vs ${userId}`);
      }
      
      if (!dateMatches && entry.userId === userId) {
        // Log detailed date comparison for debugging
        logDateComparison(entryDate, selectedDay, "date-mismatch");
      }
      
      return matches;
    });
    
    logger.debug("[useEntryQueries] Found", filtered.length, "entries for date", 
      formatDateForComparison(selectedDay), "and user", userId);
      
    // Log the filtered entries
    if (filtered.length > 0) {
      logger.debug("[useEntryQueries] Filtered entries:", 
        filtered.map(e => ({id: e.id, date: e.date, hours: e.hours})));
    } else {
      logger.debug("[useEntryQueries] No entries found for this date");
    }
    
    return filtered;
  }, [entries, userId]);

  // Get entries for the whole month
  const getMonthEntries = useCallback((month: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering month entries');
      return [];
    }
    
    const monthYear = month.getMonth() + '-' + month.getFullYear();
    logger.debug(`[useEntryQueries] Getting entries for month: ${monthYear}`);
    
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) return false;
      
      return (
        entry.userId === targetUserId && 
        entryDate.getMonth() === month.getMonth() && 
        entryDate.getFullYear() === month.getFullYear()
      );
    });
  }, [entries, userId]);

  // Calculate total hours for a set of entries
  const calculateTotalHours = useCallback((entriesList?: TimeEntry[]): number => {
    const entriesToCalculate = entriesList || entries;
    const total = entriesToCalculate.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    return total;
  }, [entries]);

  return {
    getDayEntries,
    getMonthEntries,
    calculateTotalHours
  };
};
