
import React, { ReactNode, useCallback } from 'react';
import { CalendarProvider, useCalendarContext } from './calendar-context/CalendarContext';
import { UserTimesheetProvider, useUserTimesheetContext } from './user-context/UserTimesheetContext';
import { TimeEntryProvider } from './entries-context/TimeEntryContext';
import { TimesheetUIProvider, useTimesheetUIContext } from './ui-context/TimesheetUIContext';
import { WorkHoursProvider } from './work-hours-context/WorkHoursContext';
import { useTimesheetContext as useTimesheetUser } from '@/hooks/timesheet/useTimesheetContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Timesheet Context Module
 * 
 * Provides centralized state management for timesheet functionality.
 * This is the main entry point for timesheet-related components.
 * 
 * Context Hierarchy:
 * - TimesheetProvider (top-level)
 *   - TimesheetUIProvider (UI state)
 *   - UserTimesheetProvider (user-specific data)
 *     - WorkHoursProvider (work hours calculations)
 *       - CalendarProvider (calendar navigation)
 *         - TimeEntryProvider* (time entries - supplied separately)
 * 
 * *TimeEntryProvider is provided separately in the page component
 * to have access to route parameters.
 */

// Re-export individual context hooks for easier access from components
export { useCalendarContext } from './calendar-context/CalendarContext';
export { useUserTimesheetContext } from './user-context/UserTimesheetContext';
export { useTimeEntryContext } from './entries-context/TimeEntryContext';
export { useEntriesContext } from './entries-context/EntriesContext';
export { useTimesheetUIContext } from './ui-context/TimesheetUIContext';
export { useWorkHoursContext } from './work-hours-context/WorkHoursContext';

// Custom event to trigger auto-save across components
// Enhanced with debounce protection
let lastTriggerTime = 0;

/**
 * Triggers a global save event for all timesheet components
 * Includes debounce protection to prevent multiple calls
 */
export const triggerGlobalSave = () => {
  // Prevent multiple triggers in quick succession
  const now = Date.now();
  if (now - lastTriggerTime < 300) {
    console.debug("[TimesheetContext] Skipping duplicate save event trigger");
    return false;
  }
  
  console.debug("[TimesheetContext] Dispatching global save event");
  const event = new CustomEvent('timesheet:save-pending-changes');
  window.dispatchEvent(event);
  
  lastTriggerTime = now;
  return true;
};

/**
 * Main hook to access timesheet functionality
 * Combines all specialized context hooks into one unified API
 */
export const useTimesheetContext = () => {
  const calendar = useCalendarContext();
  const user = useUserTimesheetContext();
  const ui = useTimesheetUIContext();
  
  // Combine all context values into one object for backward compatibility
  return {
    ...calendar,
    ...user,
    ...ui
  };
};

interface TimesheetProviderProps {
  children: ReactNode;
}

/**
 * Main provider component that manages the timesheet context hierarchy
 * This wraps all specialized providers in the correct order
 */
export const TimesheetProvider: React.FC<TimesheetProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // This function will be called before the date changes
  const handleBeforeDateChange = useCallback(() => {
    console.log("[TimesheetProvider] Date is about to change - triggering save event");
    // Dispatch our custom event to notify components
    triggerGlobalSave();
  }, []);
  
  // Setup window navigation event listener
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.debug("[TimesheetProvider] Page unload detected, triggering save");
      triggerGlobalSave();
      
      // Standard approach to show confirmation dialog
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Simplified provider nesting structure
  return (
    <TimesheetUIProvider>
      <UserTimesheetProvider>
        <WorkHoursProvider>
          <CalendarProvider onBeforeDateChange={handleBeforeDateChange}>
            {children}
          </CalendarProvider>
        </WorkHoursProvider>
      </UserTimesheetProvider>
    </TimesheetUIProvider>
  );
};
