/**
 * Unified Time Entry Service
 * 
 * This file provides a centralized service for all time entry operations.
 */
import { TimeEntry } from "@/types";
import { EventManager } from "./event-handling";

// Storage key constants
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries';

// Export storage write lock for concurrency control
export const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null
};

// Event types
export type TimeEntryEventType = 
  'create' | 'update' | 'delete' | 
  'sync' | 'storage-sync' | 'all';

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

export interface TimeEntryServiceConfig {
  useLocalStorage?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
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

// Validation function
export const validateTimeEntry = (entry: TimeEntry): ValidationResult => {
  const errors: string[] = [];
  
  if (!entry.userId) errors.push('User ID is required');
  if (!entry.date) errors.push('Date is required');
  if (typeof entry.hours !== 'number' || entry.hours <= 0) {
    errors.push('Hours must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Unified service class
export class UnifiedTimeEntryService {
  private eventManager: EventManager;
  
  constructor() {
    this.eventManager = new EventManager();
  }
  
  // Add methods here for full implementation
  public init() {
    // Initialize the service
    console.log('Initializing UnifiedTimeEntryService');
  }
  
  public getEntries(): TimeEntry[] {
    // Get all entries
    return [];
  }
  
  public getEntry(id: string): TimeEntry | null {
    // Get a specific entry
    return null;
  }
  
  public createEntry(entry: Omit<TimeEntry, 'id'>): string | null {
    // Create a new entry
    return null;
  }
  
  public updateEntry(id: string, updates: Partial<TimeEntry>): boolean {
    // Update an existing entry
    return false;
  }
  
  public deleteEntry(id: string): Promise<boolean> {
    // Delete an entry
    return Promise.resolve(false);
  }
  
  public addEventListener(type: TimeEntryEventType, listener: TimeEntryEventListener): () => void {
    return this.eventManager.addEventListener(type, listener);
  }
}

// Export a singleton instance
export const unifiedTimeEntryService = new UnifiedTimeEntryService();
