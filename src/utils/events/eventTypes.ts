
/**
 * Standard event types for the application
 * Centralizing these prevents typos and inconsistencies
 */

// Time entry events
export const TIME_ENTRY_EVENTS = {
  CREATED: 'entry:created',
  UPDATED: 'entry:updated',
  DELETED: 'entry:deleted',
  BATCH_UPDATED: 'entries:batch-updated',
  LOADED: 'entries:loaded'
};

// Work hours events
export const WORK_HOURS_EVENTS = {
  UPDATED: 'work-hours:updated',
  RESET: 'work-hours:reset',
  LOADED: 'work-hours:loaded',
  CHANGED: 'work-hours:changed'
};

// TOIL events
export const TOIL_EVENTS = {
  CALCULATED: 'toil:calculated',
  UPDATED: 'toil:updated',
  CONSUMED: 'toil:consumed',
  SUMMARY_UPDATED: 'toil:summary-updated'
};

// Calendar events
export const CALENDAR_EVENTS = {
  DATE_CHANGED: 'calendar:date-changed',
  MONTH_CHANGED: 'calendar:month-changed',
  SELECTION_CHANGED: 'calendar:selection-changed'
};

// System events
export const SYSTEM_EVENTS = {
  SYNC_STORAGE: 'system:storage-sync',
  SAVE_PENDING: 'system:save-pending',
  ERROR: 'system:error',
  SERVICE_READY: 'system:service-ready'
};

// Collection of all event types for easier import
export const EVENT_TYPES = {
  ...TIME_ENTRY_EVENTS,
  ...WORK_HOURS_EVENTS,
  ...TOIL_EVENTS,
  ...CALENDAR_EVENTS,
  ...SYSTEM_EVENTS
};

// Helper type for typed event handling
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Typed event data interfaces
export interface TimeEntryEventData {
  entryId?: string;
  entry?: any;
  entries?: any[];
  userId?: string;
  date?: Date;
}

export interface WorkHoursEventData {
  userId?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  hours?: number;
  isCustom?: boolean;
}

export interface TOILEventData {
  userId?: string;
  date?: Date;
  hours?: number;
  summary?: any;
  monthYear?: string;
}

export interface CalendarEventData {
  previousDate?: Date;
  newDate?: Date;
  previousMonth?: string;
  newMonth?: string;
}

export interface SystemEventData {
  source?: string;
  error?: any;
  context?: string;
  timestamp?: number;
}
