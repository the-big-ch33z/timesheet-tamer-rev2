
// Re-export all context hooks and providers in a clean, organized way

// Main context
export { 
  TimesheetProvider, 
  useTimesheetContext, 
  triggerGlobalSave 
} from './TimesheetContext';

// Calendar context
export { 
  CalendarProvider, 
  useCalendarContext 
} from './calendar-context/CalendarContext';

// User context
export { 
  UserTimesheetProvider, 
  useUserTimesheetContext 
} from './user-context/UserTimesheetContext';

// Entries context
export { 
  TimeEntryProvider, 
  useTimeEntryContext 
} from './entries-context/TimeEntryContext';

// Legacy entries context (for backwards compatibility)
export { 
  EntriesProvider, 
  useEntriesContext 
} from './entries-context/EntriesContext';

// UI context
export { 
  TimesheetUIProvider, 
  useTimesheetUIContext 
} from './ui-context/TimesheetUIContext';

// Work hours context
export { 
  WorkHoursProvider, 
  useWorkHoursContext 
} from './work-hours-context/WorkHoursContext';

// Type definitions
export * from './types';
