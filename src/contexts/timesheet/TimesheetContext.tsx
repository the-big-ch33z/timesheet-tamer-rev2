
import React, { ReactNode } from 'react';
import { CalendarProvider } from './calendar-context/CalendarContext';
import { UserTimesheetProvider } from './user-context/UserTimesheetContext';
import { EntriesProvider } from './entries-context/EntriesContext';
import { TimesheetUIProvider } from './ui-context/TimesheetUIContext';
import { useTimesheetContext as useTimesheetUser } from '@/hooks/timesheet/useTimesheetContext';

// Re-export individual context hooks
export { useCalendarContext } from './calendar-context/CalendarContext';
export { useUserTimesheetContext } from './user-context/UserTimesheetContext';
export { useEntriesContext } from './entries-context/EntriesContext';
export { useTimesheetUIContext } from './ui-context/TimesheetUIContext';

// This is the main hook that combines all the specialized context hooks
export const useTimesheetContext = () => {
  const calendar = useCalendarContext();
  const user = useUserTimesheetContext();
  const entries = useEntriesContext();
  const ui = useTimesheetUIContext();
  
  // Combine all context values into one object for backward compatibility
  return {
    ...calendar,
    ...user,
    ...entries,
    ...ui
  };
};

interface TimesheetProviderProps {
  children: ReactNode;
}

// Provider component that wraps all specialized providers
export const TimesheetProvider: React.FC<TimesheetProviderProps> = ({ children }) => {
  const { targetUserId } = useTimesheetUser();
  
  return (
    <TimesheetUIProvider>
      <UserTimesheetProvider>
        <CalendarProvider>
          <EntriesProvider userId={targetUserId}>
            {children}
          </EntriesProvider>
        </CalendarProvider>
      </UserTimesheetProvider>
    </TimesheetUIProvider>
  );
};
