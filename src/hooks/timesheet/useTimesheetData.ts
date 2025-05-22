
import { useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { useUnifiedTimeEntries } from '@/hooks/useUnifiedTimeEntries';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimesheetData');

interface UseTimesheetDataOptions {
  userId: string;
  date: Date;
}

/**
 * Hook for retrieving timesheet data for a specific user and date
 * Uses the unified time entries hook internally
 */
export const useTimesheetData = (options: UseTimesheetDataOptions) => {
  const { userId, date } = options;
  
  const {
    entries,
    isLoading,
    error,
    refreshEntries
  } = useUnifiedTimeEntries({
    userId,
    date
  });

  useEffect(() => {
    logger.debug(`Fetching timesheet data for user ${userId} on date ${date.toISOString()}`);
  }, [userId, date]);

  return {
    entries,
    isLoading,
    error,
    refreshEntries
  };
};

export default useTimesheetData;
