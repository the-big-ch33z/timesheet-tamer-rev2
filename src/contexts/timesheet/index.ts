
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
  useCalendarContext,
  CalendarContext
} from './calendar-context';

// User context
export { 
  UserTimesheetProvider, 
  useUserTimesheetContext,
  UserTimesheetContext
} from './user-context';

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
  useTimesheetUIContext,
  TimesheetUIContext
} from './ui-context';

// Work hours context
export { 
  WorkHoursProvider, 
  useWorkHoursContext 
} from './work-hours-context/WorkHoursContext';

// Type definitions
export * from './types';
