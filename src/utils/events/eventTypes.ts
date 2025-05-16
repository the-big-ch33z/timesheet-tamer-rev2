
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

export const SCHEDULE_EVENTS = {
  CREATED: 'schedule:created',
  UPDATED: 'schedule:updated',
  DELETED: 'schedule:deleted',
  DEFAULT_UPDATED: 'schedule:default-updated',
  USER_SCHEDULE_UPDATED: 'schedule:user-schedule-updated',
};

export const USER_EVENTS = {
  UPDATED: 'user:updated',
  CREATED: 'user:created',
  DELETED: 'user:deleted',
};

// Utility function to build full event names with namespace
export const buildEventName = (namespace: string, event: string): string => {
  return `${namespace}:${event}`;
};
