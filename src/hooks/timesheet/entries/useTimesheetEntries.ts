
import { useUnifiedTimeEntries } from '@/hooks/useUnifiedTimeEntries';
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

/**
 * @deprecated Use useTimesheetData from '@/hooks/timesheet/useTimesheetData' instead.
 * This hook will be removed in a future version.
 */
export const useTimesheetEntries = (userId?: string) => {
  deprecationWarning(
    'useTimesheetEntries',
    'This hook is deprecated. Please use useTimesheetData from @/hooks/timesheet/useTimesheetData instead.'
  );
  
  // Forward to the consolidated hook
  return useUnifiedTimeEntries({ userId });
};
