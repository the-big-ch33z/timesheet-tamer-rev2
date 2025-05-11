
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
 * Configuration options for the time entry service
 */
export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;  // in milliseconds
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

/**
 * Configuration for time entry operations
 */
export interface TimeEntryOperationsConfig {
  serviceName?: string;
  storageKey: string;
  validateOnSave?: boolean;
  enableAuditing?: boolean;
  enableCache?: boolean;
}

/**
 * Base interface for time entry operations
 */
export interface TimeEntryBaseOperations {
  createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null;
  updateEntry(entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]): boolean;
  deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean>;
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
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}
