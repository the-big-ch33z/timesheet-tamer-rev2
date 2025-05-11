
import { TimeEntry } from "@/types";

// Configuration for time entry service
export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

// Cache for time entries
export interface EntryCache {
  entries: TimeEntry[];
  timestamp: number;
  valid: boolean;
}

// Result of validation
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Types of events that can be emitted by the time entry service
export type TimeEntryEventType = 
  | 'entry-created'
  | 'entry-updated'
  | 'entry-deleted'
  | 'entries-loaded'
  | 'error'
  | 'storage-sync'
  | 'all';

// Structure for time entry events
export interface TimeEntryEvent {
  type: TimeEntryEventType;
  timestamp: Date;
  payload: Record<string, any>;
  userId?: string;
}

// Work schedule day configuration
export interface WorkScheduleDayConfig {
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  totalHours?: number;
}

// Event listener type
export type TimeEntryEventListener = (event: TimeEntryEvent) => void;
