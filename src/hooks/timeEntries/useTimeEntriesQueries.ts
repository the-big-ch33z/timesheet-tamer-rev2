
import { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { UnifiedTimeEntriesQueries, UseUnifiedTimeEntriesOptions } from './types';

const logger = createTimeLogger('useTimeEntriesQueries');

/**
 * Hook to provide query operations for time entries
 */
export const useTimeEntriesQueries = (
  entries: TimeEntry[],
  options: UseUnifiedTimeEntriesOptions = {}
): UnifiedTimeEntriesQueries => {
  const { userId } = options;
  
  // Helper functions
  const getDayEntries = useCallback((day: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering day entries');
      return [];
    }
    
    return unifiedTimeEntryService.getDayEntries(day, targetUserId);
  }, [userId]);
  
  const getMonthEntries = useCallback((month: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering month entries');
      return [];
    }
    
    return unifiedTimeEntryService.getMonthEntries(month, targetUserId);
  }, [userId]);
  
  const calculateTotalHours = useCallback((entriesToCalculate?: TimeEntry[]): number => {
    const entriesToUse = entriesToCalculate || entries;
    return unifiedTimeEntryService.calculateTotalHours(entriesToUse);
  }, [entries]);

  return {
    getDayEntries,
    getMonthEntries,
    calculateTotalHours
  };
};
