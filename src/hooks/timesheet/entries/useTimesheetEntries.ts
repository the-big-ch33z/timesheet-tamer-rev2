import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry } from "@/types";
import { useLogger } from "../../useLogger";
import { timeEntryService } from "@/utils/time/services/timeEntryService";
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

/**
 * @deprecated Use useTimesheetData from '@/hooks/timesheet/useTimesheetData' instead.
 * This hook will be removed in a future version.
 */
export const useTimesheetEntries = (userId?: string) => {
  deprecationWarning(
    'useTimesheetEntries',
    'This hook is deprecated. Please use useTimesheetData from @/hooks/timesheet/useTimesheetData instead.'
  );
  
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const logger = useLogger("TimesheetEntries");
  
  // Load entries only once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const loadedEntries = timeEntryService.getUserEntries(userId);
    setEntries(loadedEntries);
    setIsLoading(false);
  }, [userId, logger]);
  
  // Setup event listener for storage changes (for multi-tab support)
  useEffect(() => {
    if (!userId) return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'timeEntries') {
        logger.debug('Storage change detected, reloading entries');
        const userEntries = timeEntryService.getUserEntries(userId);
        setEntries(userEntries);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId, logger]);
  
  // Create functions for adding, deleting, and creating entries
  const addEntry = useCallback((entry: TimeEntry) => {
    logger.debug('Adding entry:', entry);
    
    // Use the service to create the entry (if it doesn't have an ID yet)
    if (!entry.id) {
      const result = timeEntryService.createEntry(entry);
      if (result) {
        // Refresh entries
        const userEntries = timeEntryService.getUserEntries(userId || '');
        setEntries(userEntries);
      }
      return;
    }
    
    // If it already has an ID, it's an update
    const allEntries = timeEntryService.getAllEntries();
    const entryExists = allEntries.some(e => e.id === entry.id);
    
    if (entryExists) {
      // Update the existing entry
      timeEntryService.updateEntry(entry.id, entry);
    } else {
      // Add as a new entry with the provided ID
      const newEntries = [...allEntries, entry];
      timeEntryService.saveEntries(newEntries);
    }
    
    // Refresh entries
    if (userId) {
      const userEntries = timeEntryService.getUserEntries(userId);
      setEntries(userEntries);
    }
  }, [userId, logger]);
  
  const deleteEntry = useCallback((entryId: string) => {
    logger.debug('Deleting entry:', entryId);
    
    const result = timeEntryService.deleteEntry(entryId);
    
    if (result && userId) {
      // Refresh entries
      const userEntries = timeEntryService.getUserEntries(userId);
      setEntries(userEntries);
    }
    
    return result;
  }, [userId, logger]);
  
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    logger.debug('Creating new entry:', entryData);
    
    const result = timeEntryService.createEntry({
      ...entryData,
      userId: entryData.userId || userId || ''
    });
    
    if (result && userId) {
      // Refresh entries
      const userEntries = timeEntryService.getUserEntries(userId);
      setEntries(userEntries);
    }
    
    return result || '';
  }, [userId, logger]);
  
  // Create query functions for filtering entries
  const getUserEntries = useCallback((userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) {
      logger.debug('No user ID provided for filtering entries');
      return [];
    }
    
    return timeEntryService.getUserEntries(targetUserId);
  }, [userId, logger]);
  
  const getDayEntries = useCallback((day: Date, userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) {
      logger.debug('No user ID provided for filtering day entries');
      return [];
    }
    
    return timeEntryService.getDayEntries(day, targetUserId);
  }, [userId, logger]);
  
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
