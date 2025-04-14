
import { TimeEntry } from "@/types";
import { ensureDate } from "@/utils/time/validation";

// Storage key constant to ensure consistency
export const STORAGE_KEY = 'timeEntries';

// Lock mechanism to prevent simultaneous writes to localStorage
export const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null,
  acquire: function(): boolean {
    if (this.isLocked) return false;
    
    this.isLocked = true;
    
    // Auto-release lock after 2 seconds as a safety measure
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.lockTimeout = setTimeout(() => {
      this.release();
      console.warn("[TimeEntryStorage] Storage lock auto-released after timeout");
    }, 2000);
    
    return true;
  },
  release: function(): void {
    this.isLocked = false;
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
  }
};

// Load entries from localStorage
export const loadEntriesFromStorage = (): TimeEntry[] => {
  try {
    console.debug("[TimeEntryStorage] Loading entries from localStorage");
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries).map((entry: any) => {
        // Ensure entry.date is a valid Date object
        const entryDate = ensureDate(entry.date);
        if (!entryDate) {
          console.warn('[TimeEntryStorage] Invalid date in entry:', entry);
        }
        
        return {
          ...entry,
          date: entryDate || new Date()
        };
      });
      console.debug("[TimeEntryStorage] Loaded entries from localStorage:", parsedEntries.length);
      return parsedEntries;
    } else {
      console.debug("[TimeEntryStorage] No entries found in localStorage");
      // Initialize with empty array to prevent future loads
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    console.error("[TimeEntryStorage] Error loading entries:", error);
    return [];
  }
};

// Save entries to localStorage with conflict resolution
export const saveEntriesToStorage = (entriesToSave: TimeEntry[], isInitialized: boolean): boolean => {
  console.debug("[TimeEntryStorage] Attempting to save entries", { count: entriesToSave.length });
  
  // Try to acquire the lock
  if (!storageWriteLock.acquire()) {
    console.debug("[TimeEntryStorage] Storage write lock busy");
    return false;
  }
  
  try {
    // Read the latest state to check for conflicts
    const currentSaved = localStorage.getItem(STORAGE_KEY);
    let currentEntries: TimeEntry[] = [];
    
    if (currentSaved) {
      try {
        currentEntries = JSON.parse(currentSaved);
      } catch (e) {
        console.error("[TimeEntryStorage] Error parsing current entries", e);
        currentEntries = [];
      }
    }
    
    // Check for conflicts by comparing entry counts
    if (isInitialized && currentEntries.length !== entriesToSave.length) {
      console.debug("[TimeEntryStorage] Potential conflict detected, merging entries", { 
        current: currentEntries.length, 
        new: entriesToSave.length 
      });
      
      // Merge entries using a Map to avoid duplicates
      const entriesMap = new Map<string, TimeEntry>();
      entriesToSave.forEach(entry => entriesMap.set(entry.id, entry));
      
      // Add entries that aren't in our state
      currentEntries.forEach(entry => {
        if (!entriesMap.has(entry.id)) {
          console.debug("[TimeEntryStorage] Keeping entry from localStorage", { id: entry.id });
          entriesMap.set(entry.id, entry);
        }
      });
      
      // Convert map back to array
      entriesToSave = Array.from(entriesMap.values());
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
    console.debug("[TimeEntryStorage] Saved entries successfully", { count: entriesToSave.length });
    return true;
  } catch (error) {
    console.error("[TimeEntryStorage] Error saving entries:", error);
    return false;
  } finally {
    // Release the lock
    storageWriteLock.release();
  }
};
