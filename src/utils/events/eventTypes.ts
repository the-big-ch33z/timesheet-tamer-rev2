
/**
 * Centralized event type definitions
 * This ensures consistent event naming across the application
 */

// TOIL related events
export const TOIL_EVENTS = {
  UPDATED: 'toil:updated', // General TOIL data changed
  SUMMARY_UPDATED: 'toil:summary-updated', // TOIL summary data updated
  RECORD_CREATED: 'toil:record-created', // New TOIL record created
  RECORD_UPDATED: 'toil:record-updated', // Existing TOIL record updated
  RECORD_DELETED: 'toil:record-deleted', // TOIL record deleted
  REFRESH_REQUESTED: 'toil:refresh-requested', // Explicit refresh requested
  ERROR: 'toil:error' // Error in TOIL processing
};

// Time entry related events
export const TIME_ENTRY_EVENTS = {
  CREATED: 'time-entry:created',
  UPDATED: 'time-entry:updated',
  DELETED: 'time-entry:deleted',
  BATCH_UPDATED: 'time-entry:batch-updated',
  LOAD_COMPLETED: 'time-entry:load-completed'
};

// Work hours related events
export const WORK_HOURS_EVENTS = {
  UPDATED: 'work-hours:updated',
  SCHEDULE_CHANGED: 'work-hours:schedule-changed',
  DAY_COMPLETED: 'work-hours:day-completed'
};

// User related events
export const USER_EVENTS = {
  PROFILE_UPDATED: 'user:profile-updated',
  PREFERENCES_CHANGED: 'user:preferences-changed'
};

// App lifecycle events
export const APP_EVENTS = {
  INITIALIZED: 'app:initialized',
  CONFIG_LOADED: 'app:config-loaded',
  ERROR: 'app:error'
};
