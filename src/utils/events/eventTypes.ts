
/**
 * Centralized event type definitions
 * This ensures consistent event naming across the application
 */

// Type definition for event types
export type EventType = keyof typeof ALL_EVENTS;

// TOIL related events
export const TOIL_EVENTS = {
  UPDATED: 'toil:updated', // General TOIL data changed
  SUMMARY_UPDATED: 'toil:summary-updated', // TOIL summary data updated
  RECORD_CREATED: 'toil:record-created', // New TOIL record created
  RECORD_UPDATED: 'toil:record-updated', // Existing TOIL record updated
  RECORD_DELETED: 'toil:record-deleted', // TOIL record deleted
  REFRESH_REQUESTED: 'toil:refresh-requested', // Explicit refresh requested
  ERROR: 'toil:error', // Error in TOIL processing
  CALCULATED: 'toil:calculated' // TOIL calculation completed
};

// Time entry related events
export const TIME_ENTRY_EVENTS = {
  CREATED: 'time-entry:created',
  UPDATED: 'time-entry:updated',
  DELETED: 'time-entry:deleted',
  BATCH_UPDATED: 'time-entry:batch-updated',
  LOAD_COMPLETED: 'time-entry:load-completed',
  LOADED: 'time-entry:loaded' // Added for compatibility
};

// Work hours related events
export const WORK_HOURS_EVENTS = {
  UPDATED: 'work-hours:updated',
  SCHEDULE_CHANGED: 'work-hours:schedule-changed',
  DAY_COMPLETED: 'work-hours:day-completed',
  RESET: 'work-hours:reset',
  CHANGED: 'work-hours:changed',
  ACTION_TOGGLED: 'work-hours:action-toggled',
  REFRESHED: 'work-hours:refreshed'
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

// Schedule related events
export const SCHEDULE_EVENTS = {
  UPDATED: 'schedule:updated',
  CREATED: 'schedule:created',
  DELETED: 'schedule:deleted',
  ASSIGNED: 'schedule:assigned',
  UNASSIGNED: 'schedule:unassigned'
};

// System events
export const SYSTEM_EVENTS = {
  ERROR: 'system:error',
  WARNING: 'system:warning',
  INFO: 'system:info',
  SUCCESS: 'system:success'
};

// Group all events for easy access by type
export const ALL_EVENTS = {
  ...TOIL_EVENTS,
  ...TIME_ENTRY_EVENTS,
  ...WORK_HOURS_EVENTS,
  ...USER_EVENTS,
  ...APP_EVENTS,
  ...SCHEDULE_EVENTS,
  ...SYSTEM_EVENTS
};
