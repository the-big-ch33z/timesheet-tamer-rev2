
import { TimeEntry } from "@/types";

export interface TimeEntryOperationsConfig {
  storageKey: string;
  enableCaching?: boolean;
  cacheTTL?: number;
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
}

export interface TimeEntryBaseOperations {
  createEntry: (entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]) => string | null;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]) => boolean;
  deleteEntry: (entryId: string, deletedEntryIds: string[]) => Promise<boolean> | boolean;
}
