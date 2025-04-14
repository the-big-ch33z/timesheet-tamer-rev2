
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { areSameDates, formatDateForComparison, isValidDate, ensureDate } from '@/utils/time/validation';

interface TimeEntryContextProps {
  children: React.ReactNode;
  selectedDate: Date;
  userId?: string;
}

interface TimeEntryContextValue {
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  addEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (entryId: string) => void;
  calculateTotalHours: () => number;
  isLoading: boolean;
}

const TimeEntryContext = createContext<TimeEntryContextValue | undefined>(undefined);

// Storage key constant to ensure consistency
const STORAGE_KEY = 'timeEntries';

// Lock mechanism to prevent simultaneous writes to localStorage
const storageWriteLock = {
  isLocked: false,
  lockTimeout: null as NodeJS.Timeout | null,
  acquire: function(): boolean {
    if (this.isLocked) return false;
    
    this.isLocked = true;
    
    // Auto-release lock after 2 seconds as a safety measure
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.lockTimeout = setTimeout(() => {
      this.release();
      console.warn("[TimeEntryContext] Storage lock auto-released after timeout");
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

export const useTimeEntryContext = () => {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  return context;
};

export const TimeEntryProvider: React.FC<TimeEntryContextProps> = ({ 
  children, 
  selectedDate, 
  userId 
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Validate the selectedDate
  const safeSelectedDate = useCallback(() => {
    if (!selectedDate || !isValidDate(selectedDate)) {
      console.warn('[TimeEntryContext] Invalid selectedDate, defaulting to today:', selectedDate);
      return new Date();
    }
    return selectedDate;
  }, [selectedDate]);

  // Load entries on mount - only once
  useEffect(() => {
    if (isInitialized) return;
    
    const loadEntries = () => {
      try {
        console.debug("[TimeEntryContext] Loading entries from localStorage");
        const savedEntries = localStorage.getItem(STORAGE_KEY);
        if (savedEntries) {
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => {
            // Ensure entry.date is a valid Date object
            const entryDate = ensureDate(entry.date);
            if (!entryDate) {
              console.warn('[TimeEntryContext] Invalid date in entry:', entry);
            }
            
            return {
              ...entry,
              date: entryDate || new Date()
            };
          });
          setEntries(parsedEntries);
          console.debug("[TimeEntryContext] Loaded entries from localStorage:", parsedEntries.length);
          console.debug("[TimeEntryContext] First few entries:", parsedEntries.slice(0, 3));
        } else {
          console.debug("[TimeEntryContext] No entries found in localStorage");
          // Initialize with empty array to prevent future loads
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
      } catch (error) {
        console.error("[TimeEntryContext] Error loading entries:", error);
        toast({
          title: "Error loading entries",
          description: "Your entries could not be loaded. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadEntries();
  }, [toast, isInitialized]);

  // Save entries with conflict resolution
  const saveEntriesToStorage = useCallback((entriesToSave: TimeEntry[]) => {
    console.debug("[TimeEntryContext] Attempting to save entries", { count: entriesToSave.length });
    
    // Try to acquire the lock
    if (!storageWriteLock.acquire()) {
      console.debug("[TimeEntryContext] Storage write lock busy, scheduling retry");
      
      // Schedule a retry after a short delay
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveEntriesToStorage(entriesToSave), 300);
      return;
    }
    
    try {
      // Read the latest state to check for conflicts
      const currentSaved = localStorage.getItem(STORAGE_KEY);
      let currentEntries: TimeEntry[] = [];
      
      if (currentSaved) {
        try {
          currentEntries = JSON.parse(currentSaved);
        } catch (e) {
          console.error("[TimeEntryContext] Error parsing current entries", e);
          currentEntries = [];
        }
      }
      
      // Check for conflicts by comparing entry counts
      if (isInitialized && currentEntries.length !== entriesToSave.length) {
        console.debug("[TimeEntryContext] Potential conflict detected, merging entries", { 
          current: currentEntries.length, 
          new: entriesToSave.length 
        });
        
        // Merge entries using a Map to avoid duplicates
        const entriesMap = new Map<string, TimeEntry>();
        entriesToSave.forEach(entry => entriesMap.set(entry.id, entry));
        
        // Add entries that aren't in our state
        currentEntries.forEach(entry => {
          if (!entriesMap.has(entry.id)) {
            console.debug("[TimeEntryContext] Keeping entry from localStorage", { id: entry.id });
            entriesMap.set(entry.id, entry);
          }
        });
        
        // Convert map back to array
        entriesToSave = Array.from(entriesMap.values());
      }
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
      console.debug("[TimeEntryContext] Saved entries successfully", { count: entriesToSave.length });
    } catch (error) {
      console.error("[TimeEntryContext] Error saving entries:", error);
    } finally {
      // Release the lock
      storageWriteLock.release();
    }
  }, [isInitialized]);

  // Save entries when they change - with debounce
  useEffect(() => {
    if (!isInitialized || isLoading) return; // Don't save during initial load
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      saveEntriesToStorage(entries);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, isInitialized, isLoading, saveEntriesToStorage]);

  // Save on unmount to ensure latest state is persisted
  useEffect(() => {
    return () => {
      if (isInitialized && !isLoading) {
        console.debug("[TimeEntryContext] Saving entries on unmount");
        saveEntriesToStorage(entries);
      }
    };
  }, [entries, isInitialized, isLoading, saveEntriesToStorage]);

  // Save on window unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isInitialized && !isLoading) {
        console.debug("[TimeEntryContext] Saving entries before page unload");
        // Use synchronous localStorage save for beforeunload
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
          console.error("[TimeEntryContext] Error saving on unload:", error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [entries, isInitialized, isLoading]);

  // Filter entries for the selected day
  const dayEntries = useCallback(() => {
    if (!userId) {
      console.debug("[TimeEntryContext] No userId, returning empty dayEntries");
      return [];
    }
    
    const validSelectedDate = safeSelectedDate();
    console.debug("[TimeEntryContext] Filtering entries for date:", 
      formatDateForComparison(validSelectedDate), 
      "userId:", userId);
    
    const filtered = entries.filter(entry => {
      // Ensure entry.date is a valid Date
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) {
        console.warn('[TimeEntryContext] Invalid date in entry during filtering:', entry);
        return false;
      }
      
      const matches = areSameDates(entryDate, validSelectedDate) && entry.userId === userId;
      
      if (matches) {
        console.debug("[TimeEntryContext] Matched entry:", entry.id, "hours:", entry.hours);
      }
      
      return matches;
    });
    
    console.debug("[TimeEntryContext] Found", filtered.length, "entries for date", 
      formatDateForComparison(validSelectedDate));
    return filtered;
  }, [entries, safeSelectedDate, userId]);

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    console.debug("[TimeEntryContext] Adding new entry:", entryData);
    
    // Validate date before adding
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      console.error("[TimeEntryContext] Invalid date in new entry:", entryData);
      toast({
        title: "Error adding entry",
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return;
    }
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      date: entryDate
    };

    console.debug("[TimeEntryContext] Created entry with ID:", newEntry.id);
    
    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      console.debug("[TimeEntryContext] Updated entries array, new length:", newEntries.length);
      return newEntries;
    });
    
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    console.debug("[TimeEntryContext] Updating entry:", entryId, "with updates:", updates);
    
    // Validate date if it's being updated
    if (updates.date) {
      const validDate = ensureDate(updates.date);
      if (!validDate) {
        console.error("[TimeEntryContext] Invalid date in update:", updates);
        toast({
          title: "Error updating entry",
          description: "The entry has an invalid date.",
          variant: "destructive"
        });
        return;
      }
      updates.date = validDate;
    }
    
    setEntries(prev => {
      const entryIndex = prev.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        console.warn("[TimeEntryContext] Entry not found for update:", entryId);
        return prev;
      }
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      console.debug("[TimeEntryContext] Entry updated successfully");
      return updatedEntries;
    });
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [toast]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    console.debug("[TimeEntryContext] Attempting to delete entry:", entryId);
    
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) {
        console.warn("[TimeEntryContext] Entry not found for deletion:", entryId);
        return prev;
      }
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      console.debug("[TimeEntryContext] Entry deleted, remaining entries:", filteredEntries.length);
      
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed from your timesheet"
      });
      
      return filteredEntries;
    });
  }, [toast]);

  // Calculate total hours for the current day
  const calculateTotalHours = useCallback(() => {
    const total = dayEntries().reduce((sum, entry) => sum + (entry.hours || 0), 0);
    console.debug("[TimeEntryContext] Calculated total hours:", total);
    return total;
  }, [dayEntries]);

  const value: TimeEntryContextValue = {
    entries,
    dayEntries: dayEntries(),
    addEntry,
    updateEntry,
    deleteEntry,
    calculateTotalHours,
    isLoading
  };

  return (
    <TimeEntryContext.Provider value={value}>
      {children}
    </TimeEntryContext.Provider>
  );
};
