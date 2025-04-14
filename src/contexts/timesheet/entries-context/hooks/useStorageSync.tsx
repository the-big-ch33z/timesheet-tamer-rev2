
import { useCallback, useRef, useEffect } from 'react';
import { TimeEntry } from "@/types";
import { STORAGE_KEY } from '../timeEntryStorage';

export const useStorageSync = (
  entries: TimeEntry[],
  isInitialized: boolean,
  isLoading: boolean
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const saveEntriesToStorageDebounced = useCallback((entriesToSave: TimeEntry[]) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule save with small delay to allow batching
    saveTimeoutRef.current = setTimeout(() => {
      try {
        console.debug("[TimeEntryProvider] Saving entries to localStorage:", entriesToSave.length);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
        console.debug("[TimeEntryProvider] Save complete");
      } catch (error) {
        console.error("[TimeEntryProvider] Error saving to localStorage:", error);
      }
    }, 100);
  }, []);

  // Save entries when they change
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    saveEntriesToStorageDebounced(entries);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, isInitialized, isLoading, saveEntriesToStorageDebounced]);

  // Listen for delete events to force immediate sync
  useEffect(() => {
    const handleDeleteEvent = () => {
      console.debug("[TimeEntryProvider] Entry deletion detected, forcing immediate sync");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    };

    window.addEventListener('timesheet:entry-deleted', handleDeleteEvent);
    return () => {
      window.removeEventListener('timesheet:entry-deleted', handleDeleteEvent);
    };
  }, [entries]);

  return {
    saveEntriesToStorageDebounced
  };
};
