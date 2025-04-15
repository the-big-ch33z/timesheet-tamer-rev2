
import { TimeEntry } from "@/types";
import { ensureDate } from "@/utils/time/validation";

// Storage key constants to ensure consistency
export const STORAGE_KEY = 'timeEntries';
export const DELETED_ENTRIES_KEY = 'deletedTimeEntries'; // New key to track deleted entry IDs

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

// Get the list of deleted entry IDs
export const getDeletedEntryIds = (): string[] => {
  try {
    const deletedEntries = localStorage.getItem(DELETED_ENTRIES_KEY);
    if (deletedEntries) {
      return JSON.parse(deletedEntries);
    }
  } catch (error) {
    console.error("[TimeEntryStorage] Error loading deleted entries:", error);
  }
  return [];
};

// Add an entry ID to the deleted entries list
export const addToDeletedEntries = (entryId: string): void => {
  try {
    const deletedEntries = getDeletedEntryIds();
    if (!deletedEntries.includes(entryId)) {
      deletedEntries.push(entryId);
      localStorage.setItem(DELETED_ENTRIES_KEY, JSON.stringify(deletedEntries));
      console.debug("[TimeEntryStorage] Added entry to deleted list:", entryId);
    }
  } catch (error) {
    console.error("[TimeEntryStorage] Error adding to deleted entries:", error);
  }
};

// Clean up old deleted entries (optional, can be called periodically)
export const cleanupDeletedEntries = (maxAgeDays: number = 30): void => {
  // Implementation for future cleanup of old deleted entry IDs
  // Can be implemented later if needed
};

// Load entries from localStorage with deleted entry filtering
export const loadEntriesFromStorage = (): TimeEntry[] => {
  try {
    console.debug("[TimeEntryStorage] Loading entries from localStorage");
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    const deletedEntryIds = getDeletedEntryIds();
    
    if (savedEntries) {
      // Parse entries and filter out any that are in the deleted list
      const allEntries = JSON.parse(savedEntries);
      const filteredEntries = allEntries.filter((entry: any) => 
        !deletedEntryIds.includes(entry.id)
      ).map((entry: any) => {
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
      
      console.debug("[TimeEntryStorage] Loaded entries from localStorage:", filteredEntries.length);
      console.debug("[TimeEntryStorage] Filtered out deleted entries:", deletedEntryIds.length);
      return filteredEntries;
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
    // Get the deleted entry IDs to ensure they stay deleted
    const deletedEntryIds = getDeletedEntryIds();
    
    // Filter out any entries that are marked as deleted
    const filteredEntries = entriesToSave.filter(entry => 
      !deletedEntryIds.includes(entry.id)
    );
    
    if (filteredEntries.length !== entriesToSave.length) {
      console.debug("[TimeEntryStorage] Filtered out deleted entries before saving", { 
        original: entriesToSave.length,
        filtered: filteredEntries.length
      });
    }
    
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
    
    // Filter out deleted entries from current entries too
    currentEntries = currentEntries.filter(entry => 
      !deletedEntryIds.includes(entry.id)
    );
    
    // Check for conflicts by comparing entry counts
    if (isInitialized && currentEntries.length !== filteredEntries.length) {
      console.debug("[TimeEntryStorage] Potential conflict detected, merging entries", { 
        current: currentEntries.length, 
        new: filteredEntries.length 
      });
      
      // Merge entries using a Map to avoid duplicates
      const entriesMap = new Map<string, TimeEntry>();
      filteredEntries.forEach(entry => entriesMap.set(entry.id, entry));
      
      // Add entries that aren't in our state but don't add deleted ones
      currentEntries.forEach(entry => {
        if (!entriesMap.has(entry.id) && !deletedEntryIds.includes(entry.id)) {
          console.debug("[TimeEntryStorage] Keeping entry from localStorage", { id: entry.id });
          entriesMap.set(entry.id, entry);
        }
      });
      
      // Convert map back to array
      const mergedEntries = Array.from(entriesMap.values());
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedEntries));
      console.debug("[TimeEntryStorage] Saved merged entries successfully", { count: mergedEntries.length });
    } else {
      // Save filtered entries directly
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
      console.debug("[TimeEntryStorage] Saved entries successfully", { count: filteredEntries.length });
    }
    
    return true;
  } catch (error) {
    console.error("[TimeEntryStorage] Error saving entries:", error);
    return false;
  } finally {
    // Release the lock
    storageWriteLock.release();
  }
};

// Direct deletion of an entry - updates both the entries and the deleted list
export const deleteEntryFromStorage = (entryId: string): boolean => {
  console.debug("[TimeEntryStorage] Direct deletion of entry:", entryId);
  
  try {
    // Add to deleted entries list
    addToDeletedEntries(entryId);
    
    // Update the main storage to remove the entry
    const currentSaved = localStorage.getItem(STORAGE_KEY);
    if (currentSaved) {
      const entries = JSON.parse(currentSaved);
      const filteredEntries = entries.filter((entry: TimeEntry) => entry.id !== entryId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
      console.debug("[TimeEntryStorage] Entry removed from storage:", entryId);
      
      // Dispatch a custom event to notify other tabs
      window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
        detail: { entryId }
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[TimeEntryStorage] Error deleting entry from storage:", error);
    return false;
  }
};
