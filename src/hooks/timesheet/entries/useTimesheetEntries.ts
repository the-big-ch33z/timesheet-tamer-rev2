
import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry } from "@/types";
import { useLogger } from "../../useLogger";
import { loadEntriesFromStorage, createEntrySaver } from "./storage";
import { createEntryOperations } from "./operations";
import { createEntryQueries } from "./queries";

/**
 * Simplified hook for managing timesheet entries
 * Handles loading, viewing, and managing entries
 */
export const useTimesheetEntries = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const logger = useLogger("TimesheetEntries");
  
  // Get the entry saver with debounce and lock handling
  const { saveEntriesToStorage } = createEntrySaver(logger);
  
  // Load entries from localStorage only once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const loadedEntries = loadEntriesFromStorage(logger);
    setEntries(loadedEntries);
    setIsLoading(false);
  }, [logger]);

  // Save entries to localStorage when they change - with debounce
  const saveEntriesRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSaveEntries = useCallback((entriesToSave: TimeEntry[]) => {
    // Clear any pending save operation
    if (saveEntriesRef.current) {
      clearTimeout(saveEntriesRef.current);
    }
    
    // Schedule a new save operation
    saveEntriesRef.current = setTimeout(() => {
      saveEntriesToStorage(entriesToSave, isInitializedRef.current);
    }, 300);
  }, [saveEntriesToStorage]);
  
  // Save entries when they change
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) return;
    
    debouncedSaveEntries(entries);
    
    return () => {
      if (saveEntriesRef.current) {
        clearTimeout(saveEntriesRef.current);
      }
    };
  }, [entries, isLoading, debouncedSaveEntries]);

  // Create operations for adding, deleting, and creating entries
  const { addEntry, deleteEntry, createEntry } = createEntryOperations(setEntries, logger);

  // Create query functions for filtering entries
  const { getUserEntries, getDayEntries } = createEntryQueries(entries, userId, logger);

  return {
    entries,
    getUserEntries,
    getDayEntries,
    addEntry,
    deleteEntry,
    createEntry,
    isLoading
  };
};
