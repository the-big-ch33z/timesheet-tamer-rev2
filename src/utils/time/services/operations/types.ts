
import { TimeEntry } from "@/types";

// Define comprehensive configuration for TimeEntry operations
export interface TimeEntryOperationsConfig {
  serviceName?: string; // Make this optional
  storageKey: string;
  validateOnSave?: boolean;
  enableAuditing?: boolean;
  enableCache?: boolean;
}

// Basic operations interface
export interface TimeEntryBaseOperations {
  createEntry: (entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]) => string | null;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]) => boolean;
  deleteEntry: (entryId: string, deletedEntryIds: string[]) => Promise<boolean>;
}

// Event system types - make compatible with the system's event types
export type TimeEntryEventType = 'entry-created' | 'entry-updated' | 'entry-deleted' | 'validation';

