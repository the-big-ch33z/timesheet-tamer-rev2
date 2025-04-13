
import React, { ReactNode, useState, useCallback } from 'react';
import { CalendarProvider, useCalendarContext } from './calendar-context/CalendarContext';
import { UserTimesheetProvider, useUserTimesheetContext } from './user-context/UserTimesheetContext';
import { EntriesProvider, useEntriesContext } from './entries-context/EntriesContext';
import { TimesheetUIProvider, useTimesheetUIContext } from './ui-context/TimesheetUIContext';
import { useTimesheetContext as useTimesheetUser } from '@/hooks/timesheet/useTimesheetContext';
import { useToast } from '@/hooks/use-toast';

// Re-export individual context hooks for easier access from components
export { useCalendarContext } from './calendar-context/CalendarContext';
export { useUserTimesheetContext } from './user-context/UserTimesheetContext';
export { useEntriesContext } from './entries-context/EntriesContext';
export { useTimesheetUIContext } from './ui-context/TimesheetUIContext';

// Custom event to trigger auto-save across components
export const triggerGlobalSave = () => {
  const event = new CustomEvent('timesheet:save-pending-changes');
  window.dispatchEvent(event);
  return true;
};

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
  const { toast } = useToast();
  
  // This function will be called before the date changes
  const handleBeforeDateChange = useCallback(() => {
    console.log("Date is about to change - triggering save event");
    // Dispatch our custom event to notify components
    triggerGlobalSave();
  }, []);
  
  return (
    <TimesheetUIProvider>
      <UserTimesheetProvider>
        <CalendarProvider onBeforeDateChange={handleBeforeDateChange}>
          <EntriesProvider userId={targetUserId}>
            {children}
          </EntriesProvider>
        </CalendarProvider>
      </UserTimesheetProvider>
    </TimesheetUIProvider>
  );
};
