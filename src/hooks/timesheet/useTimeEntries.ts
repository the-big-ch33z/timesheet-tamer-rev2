
import { useCallback } from 'react';
import { useUnifiedTimeEntries } from '../useUnifiedTimeEntries';
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

/**
 * @deprecated This hook is provided for backward compatibility.
 * Please use useTimesheetData from '@/hooks/timesheet/useTimesheetData' instead.
 */
export const useTimeEntries = (userId?: string, date?: Date) => {
  deprecationWarning(
    'useTimeEntries',
    'This hook is deprecated. Please use useTimesheetData from @/hooks/timesheet/useTimesheetData instead.'
  );

  // Use the unified hook internally
  const {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    getDayEntries,
    calculateTotalHours,
    refreshEntries
  } = useUnifiedTimeEntries({ userId, date });

  // Match the original API surface
  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    getDayEntries,
    calculateTotalHours,
    refreshEntries
  };
};
