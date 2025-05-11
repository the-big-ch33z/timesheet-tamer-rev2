
import { TimeEntry } from "@/types";

// Storage key constants
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Event types
export type TimeEntryEventType = 
  'create' | 'update' | 'delete' | 
  'sync' | 'storage-sync' | 'all' |
  'entries-loaded' | 'entry-created' | 'entry-updated' | 
  'entry-deleted' | 'error';

export interface TimeEntryEvent {
  type: TimeEntryEventType;
  timestamp: Date;
  userId?: string;
  payload?: any;
}

export type TimeEntryEventListener = (event: TimeEntryEvent) => void;

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Service configuration
export interface TimeEntryServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  validateOnAccess?: boolean;
  enableAuditing?: boolean;
  storageKey?: string;
}

// Cache structure
export interface EntryCache {
  entries: TimeEntry[];
  timestamp: number;
  valid: boolean;
}

// Core calculation functions
export const calculateTotalHours = (entries: TimeEntry[]): number => {
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
};

export const autoCalculateHours = (startTime: string, endTime: string, breakMinutes: number = 0): number => {
  if (!startTime || !endTime) return 0;

  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate total minutes, subtracting break time
    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    
    // Convert to hours and round to nearest quarter
    return Math.round(totalMinutes / 15) / 4;
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
};
