
import { useCallback, useRef, useEffect } from 'react';
import { TimeEntry } from "@/types";
import { STORAGE_KEY, saveEntriesToStorage, deleteEntryFromStorage, getDeletedEntryIds } from '../timeEntryStorage';

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
        // Filter out any entries that might be in the deleted list
        const deletedIds = getDeletedEntryIds();
        const filteredEntries = entriesToSave.filter(entry => !deletedIds.includes(entry.id));
        
        if (filteredEntries.length !== entriesToSave.length) {
          console.debug("[TimeEntryProvider] Filtered out deleted entries during save:", 
            entriesToSave.length - filteredEntries.length);
        }
        
        saveEntriesToStorage(filteredEntries, isInitialized);
        console.debug("[TimeEntryProvider] Save complete");
      } catch (error) {
        console.error("[TimeEntryProvider] Error saving to localStorage:", error);
      }
    }, 100);
  }, [isInitialized]);

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
    const handleDeleteEvent = (event: CustomEvent<{ entryId: string }>) => {
      const entryId = event.detail?.entryId;
      console.debug("[TimeEntryProvider] Entry deletion event detected:", entryId);
      
      // If we have an entry ID in the event, filter it out immediately
      if (entryId) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Use the direct deletion function to ensure the entry is truly gone
        deleteEntryFromStorage(entryId);
      } else {
        // Legacy event without ID - do a full sync
        console.debug("[TimeEntryProvider] Legacy deletion event detected, forcing immediate sync");
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Filter out any entries that might be deleted
        const deletedIds = getDeletedEntryIds();
        const filteredEntries = entries.filter(entry => !deletedIds.includes(entry.id));
        
        saveEntriesToStorage(filteredEntries, isInitialized);
      }
    };

    // Listen for both types of events
    window.addEventListener('timesheet:entry-deleted', handleDeleteEvent as EventListener);
    
    return () => {
      window.removeEventListener('timesheet:entry-deleted', handleDeleteEvent as EventListener);
    };
  }, [entries, isInitialized]);

  return {
    saveEntriesToStorageDebounced
  };
};
