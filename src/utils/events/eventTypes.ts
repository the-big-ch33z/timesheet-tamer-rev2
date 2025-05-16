
/**
 * Event type constants for the application
 */

export const TOIL_EVENTS = {
  SUMMARY_UPDATED: 'toil:summary-updated',
  UPDATED: 'toil:updated',
  REFRESH_REQUESTED: 'toil:refresh-requested',
  CALCULATED: 'toil:calculated',
};

export const ENTRY_EVENTS = {
  CREATED: 'entry:created',
  UPDATED: 'entry:updated',
  DELETED: 'entry:deleted',
  VALIDATION_ERROR: 'entry:validation-error',
};

// Alias for backward compatibility
export const TIME_ENTRY_EVENTS = ENTRY_EVENTS;

export const SCHEDULE_EVENTS = {
  CREATED: 'schedule:created',
  UPDATED: 'schedule:updated',
  DELETED: 'schedule:deleted',
  DEFAULT_UPDATED: 'schedule:default-updated',
  USER_SCHEDULE_UPDATED: 'schedule:user-schedule-updated',
  ASSIGNED: 'schedule:assigned'
};

export const USER_EVENTS = {
  UPDATED: 'user:updated',
  CREATED: 'user:created',
  DELETED: 'user:deleted',
};

export const SYSTEM_EVENTS = {
  ERROR: 'system:error',
  WARNING: 'system:warning',
  INFO: 'system:info'
};

export const WORK_HOURS_EVENTS = {
  UPDATED: 'work-hours:updated',
  CALCULATED: 'work-hours:calculated',
  SAVED: 'work-hours:saved',
  LOADED: 'work-hours:loaded',
  ERROR: 'work-hours:error'
};

// Type for event names
export type EventType = 
  | keyof typeof TOIL_EVENTS
  | keyof typeof ENTRY_EVENTS
  | keyof typeof SCHEDULE_EVENTS
  | keyof typeof USER_EVENTS
  | keyof typeof SYSTEM_EVENTS
  | keyof typeof WORK_HOURS_EVENTS;

// Utility function to build full event names with namespace
export const buildEventName = (namespace: string, event: string): string => {
  return `${namespace}:${event}`;
};
