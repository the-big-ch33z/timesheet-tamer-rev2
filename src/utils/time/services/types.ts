
import { TimeEntry } from "@/types";

/**
 * Event types for the time entry service
 */
export type TimeEntryEventType = 
  | 'entry-created' 
  | 'entry-updated'
  | 'entry-deleted'
  | 'entries-loaded'
  | 'storage-sync'
  | 'error'
  | 'all';

/**
 * Event payload for timesheet events
 */
export interface TimeEntryEvent {
  type: TimeEntryEventType;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

/**
 * Event listener callback type
 */
export type TimeEntryEventListener = (event: TimeEntryEvent) => void;

/**
 * Configuration options for the service
 */
export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;  // in milliseconds
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

/**
 * Cache container for time entries
 */
export interface EntryCache {
  entries: TimeEntry[];
  userEntries: Record<string, TimeEntry[]>;
  dayEntries: Record<string, TimeEntry[]>; 
  monthEntries: Record<string, TimeEntry[]>;
  timestamp: number;
  isValid: boolean;
}

/**
 * Result of entry validation
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}
