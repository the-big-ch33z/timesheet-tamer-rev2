
import { useCallback, useRef, useEffect } from 'react';
import { TimeEntry } from "@/types";
import { STORAGE_KEY } from '../timeEntryStorage';

/**
 * Hook that handles synchronization with localStorage
 */
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
    }, 500);
  }, []);

  // Save entries when they change
  useEffect(() => {
    if (!isInitialized || isLoading) return; // Don't save during initial load
    
    saveEntriesToStorageDebounced(entries);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, isInitialized, isLoading, saveEntriesToStorageDebounced]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (isInitialized && !isLoading) {
        console.debug("[TimeEntryProvider] Saving entries on unmount");
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
          console.error("[TimeEntryProvider] Error saving on unmount:", error);
        }
      }
    };
  }, [entries, isInitialized, isLoading]);
  
  // Handle window unload events
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

  return {
    saveEntriesToStorageDebounced
  };
};
