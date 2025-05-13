
import React, { ReactNode, useCallback } from 'react';
import { CalendarProvider, useCalendarContext } from './calendar-context/CalendarContext';
import { UserTimesheetProvider, useUserTimesheetContext } from './user-context/UserTimesheetContext';
import { TimeEntryProvider } from './entries-context/TimeEntryContext';
import { TimesheetUIProvider, useTimesheetUIContext } from './ui-context/TimesheetUIContext';
import { WorkHoursProvider } from './work-hours-context/WorkHoursContext';
import { useTimesheetContext as useTimesheetUser } from '@/hooks/timesheet/useTimesheetContext';
import { useToast } from '@/hooks/use-toast';
import { UnifiedTimesheetContextType } from './types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TimesheetContext');

/**
 * Timesheet Context Module
 * 
 * Provides centralized state management for timesheet functionality.
 * This is the main entry point for timesheet-related components.
 * 
 * Context Architecture:
 * - All contexts are implemented as parallel providers rather than deeply nested
 * - Each context is responsible for its own initialization and state management
 * - Inter-context communication happens through explicit dependencies or the global event bus
 * 
 * Context Dependency Hierarchy:
 * TimesheetContext
 * ├── TimesheetUIProvider (independent)
 * ├── UserTimesheetProvider (depends on auth state)
 * ├── WorkHoursProvider (independent, may use WorkScheduleContext externally)
 * └── CalendarProvider (independent)
 *     └── TimeEntryProvider (depends on selectedDate from CalendarProvider)
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
 * 
 * @returns {boolean} Whether the event was triggered
 */
export const triggerGlobalSave = (): boolean => {
  // Prevent multiple triggers in quick succession
  const now = Date.now();
  if (now - lastTriggerTime < 300) {
    logger.debug("Skipping duplicate save event trigger");
    return false;
  }
  
  logger.debug("Dispatching global save event");
  const event = new CustomEvent('timesheet:save-pending-changes');
  window.dispatchEvent(event);
  
  lastTriggerTime = now;
  return true;
};

/**
 * Main hook to access timesheet functionality
 * Combines all specialized context hooks into one unified API
 * 
 * @returns {UnifiedTimesheetContextType} Combined context values
 */
export const useTimesheetContext = (): UnifiedTimesheetContextType => {
  const calendar = useCalendarContext();
  const user = useUserTimesheetContext();
  const ui = useTimesheetUIContext();
  
  // Combine all context values into one object for backward compatibility
  return {
    ...calendar,
    ...user,
    ...ui,
    showHelpPanel: ui.showHelpPanel,
    setShowHelpPanel: ui.setShowHelpPanel,
    canEditTimesheet: user.canEditTimesheet
  };
};

interface TimesheetProviderProps {
  children: ReactNode;
}

/**
 * Main provider component that manages the timesheet context hierarchy
 * Uses a flattened context provider structure instead of deep nesting
 * 
 * @param {TimesheetProviderProps} props - Provider props
 * @returns {JSX.Element} Provider component
 */
export const TimesheetProvider: React.FC<TimesheetProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // This function will be called before the date changes
  const handleBeforeDateChange = useCallback(() => {
    logger.debug("Date is about to change - triggering save event");
    // Dispatch our custom event to notify components
    triggerGlobalSave();
  }, []);
  
  // Setup window navigation event listener
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      logger.debug("Page unload detected, triggering save");
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
  
  // Flattened provider structure - each context is now responsible for its own initialization
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
