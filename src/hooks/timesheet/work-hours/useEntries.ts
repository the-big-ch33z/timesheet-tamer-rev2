
import { useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useEntries');

/**
 * Hook to manage time entries for work hours calculations
 * Used by the useWorkHoursCore hook
 */
export const useEntries = (options: UseWorkHoursOptions = {}) => {
  const { date, userId } = options;
  const { getDayEntries } = useTimeEntryContext();
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Fetch entries when date or userId changes
  useEffect(() => {
    if (date && userId) {
      try {
        const dayEntries = getDayEntries(date);
        setEntries(dayEntries);
        logger.debug(`Loaded ${dayEntries.length} entries for date: ${date.toISOString().split('T')[0]}, user: ${userId}`);
      } catch (error) {
        logger.error('Error fetching entries:', error);
        setEntries([]);
      }
    } else {
      setEntries([]);
    }
  }, [date, userId, getDayEntries]);

  return entries;
};
