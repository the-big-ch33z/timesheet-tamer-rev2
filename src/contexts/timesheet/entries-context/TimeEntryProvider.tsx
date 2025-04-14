
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { areSameDates, formatDateForComparison, isValidDate, ensureDate } from '@/utils/time/validation';
import { TimeEntryContextValue, TimeEntryProviderProps } from './types';
import { loadEntriesFromStorage, saveEntriesToStorage, STORAGE_KEY } from './timeEntryStorage';

// Create the context
export const TimeEntryContext = createContext<TimeEntryContextValue | undefined>(undefined);

export const TimeEntryProvider: React.FC<TimeEntryProviderProps> = ({ 
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
      console.warn('[TimeEntryProvider] Invalid selectedDate, defaulting to today:', selectedDate);
      return new Date();
    }
    return selectedDate;
  }, [selectedDate]);

  // Load entries on mount - only once
  useEffect(() => {
    if (isInitialized) return;
    
    try {
      const loadedEntries = loadEntriesFromStorage();
      setEntries(loadedEntries);
    } catch (error) {
      console.error("[TimeEntryProvider] Error loading entries:", error);
      toast({
        title: "Error loading entries",
        description: "Your entries could not be loaded. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [toast, isInitialized]);

  // Save entries with debounced write
  const saveEntriesToStorageDebounced = useCallback((entriesToSave: TimeEntry[]) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule save with small delay to allow batching
    saveTimeoutRef.current = setTimeout(() => {
      if (!saveEntriesToStorage(entriesToSave, isInitialized)) {
        // If save failed due to lock, retry after a delay
        console.debug("[TimeEntryProvider] Storage write locked, scheduling retry");
        saveTimeoutRef.current = setTimeout(() => {
          saveEntriesToStorage(entriesToSave, isInitialized);
        }, 300);
      }
    }, 500);
  }, [isInitialized]);

  // Save entries when they change - with debounce
  useEffect(() => {
    if (!isInitialized || isLoading) return; // Don't save during initial load
    
    saveEntriesToStorageDebounced(entries);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, isInitialized, isLoading, saveEntriesToStorageDebounced]);

  // Save on unmount to ensure latest state is persisted
  useEffect(() => {
    return () => {
      if (isInitialized && !isLoading) {
        console.debug("[TimeEntryProvider] Saving entries on unmount");
        saveEntriesToStorage(entries, isInitialized);
      }
    };
  }, [entries, isInitialized, isLoading]);

  // Save on window unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isInitialized && !isLoading) {
        console.debug("[TimeEntryProvider] Saving entries before page unload");
        // Use synchronous localStorage save for beforeunload
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
          console.error("[TimeEntryProvider] Error saving on unload:", error);
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
      console.debug("[TimeEntryProvider] No userId, returning empty dayEntries");
      return [];
    }
    
    const validSelectedDate = safeSelectedDate();
    console.debug("[TimeEntryProvider] Filtering entries for date:", 
      formatDateForComparison(validSelectedDate), 
      "userId:", userId);
    
    const filtered = entries.filter(entry => {
      // Ensure entry.date is a valid Date
      const entryDate = entry.date instanceof Date ? entry.date : ensureDate(entry.date);
      if (!entryDate) {
        console.warn('[TimeEntryProvider] Invalid date in entry during filtering:', entry);
        return false;
      }
      
      const matches = areSameDates(entryDate, validSelectedDate) && entry.userId === userId;
      
      if (matches) {
        console.debug("[TimeEntryProvider] Matched entry:", entry.id, "hours:", entry.hours);
      }
      
      return matches;
    });
    
    console.debug("[TimeEntryProvider] Found", filtered.length, "entries for date", 
      formatDateForComparison(validSelectedDate));
    return filtered;
  }, [entries, safeSelectedDate, userId]);

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    console.debug("[TimeEntryProvider] Adding new entry:", entryData);
    
    // Validate date before adding
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      console.error("[TimeEntryProvider] Invalid date in new entry:", entryData);
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

    console.debug("[TimeEntryProvider] Created entry with ID:", newEntry.id);
    
    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      console.debug("[TimeEntryProvider] Updated entries array, new length:", newEntries.length);
      return newEntries;
    });
    
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    console.debug("[TimeEntryProvider] Updating entry:", entryId, "with updates:", updates);
    
    // Validate date if it's being updated
    if (updates.date) {
      const validDate = ensureDate(updates.date);
      if (!validDate) {
        console.error("[TimeEntryProvider] Invalid date in update:", updates);
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
        console.warn("[TimeEntryProvider] Entry not found for update:", entryId);
        return prev;
      }
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      console.debug("[TimeEntryProvider] Entry updated successfully");
      return updatedEntries;
    });
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [toast]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    console.debug("[TimeEntryProvider] Attempting to delete entry:", entryId);
    
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) {
        console.warn("[TimeEntryProvider] Entry not found for deletion:", entryId);
        return prev;
      }
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      console.debug("[TimeEntryProvider] Entry deleted, remaining entries:", filteredEntries.length);
      
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
    console.debug("[TimeEntryProvider] Calculated total hours:", total);
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
