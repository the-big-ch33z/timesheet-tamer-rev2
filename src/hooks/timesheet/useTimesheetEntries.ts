
import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { areSameDates, formatDateForComparison, ensureDate, isValidDate } from "@/utils/time/validation";

// Storage key constant to ensure consistency
const STORAGE_KEY = 'timeEntries';

/**
 * Simplified hook for managing timesheet entries
 * Only handles loading and viewing entries
 */
export const useTimesheetEntries = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const logger = useLogger("TimesheetEntries");
  
  // Load entries from localStorage only once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    try {
      logger.debug("Loading entries from localStorage");
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries).map((entry: any) => {
          // Ensure entry.date is a valid Date object
          const entryDate = ensureDate(entry.date);
          if (!entryDate) {
            logger.warn('Invalid date in entry:', entry);
          }
          
          return {
            ...entry,
            date: entryDate || new Date()
          };
        });
        setEntries(parsedEntries);
        logger.debug("Loaded entries from localStorage", { count: parsedEntries.length });
      } else {
        logger.debug("No entries found in localStorage");
        // Initialize with empty array to prevent future save/load cycles
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
    } catch (error) {
      logger.error("Error loading entries:", error);
      toast({
        title: "Error loading data",
        description: "Could not load your timesheet entries. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [logger]);

  // Save entries to localStorage when they change - with debounce and lock
  const saveEntriesRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveEntriesToStorage = useCallback((entriesToSave: TimeEntry[]) => {
    // Prevent simultaneous writes
    if (saveInProgressRef.current) {
      logger.debug("Another save operation in progress, scheduling retry");
      if (saveEntriesRef.current) clearTimeout(saveEntriesRef.current);
      
      // Schedule a retry after the current save completes
      saveEntriesRef.current = setTimeout(() => {
        saveEntriesToStorage(entriesToSave);
      }, 500);
      return;
    }
    
    try {
      saveInProgressRef.current = true;
      logger.debug("Saving entries to localStorage", { count: entriesToSave.length });
      
      // First read the latest state to avoid conflicts
      const currentSaved = localStorage.getItem(STORAGE_KEY);
      let currentEntries: TimeEntry[] = [];
      
      if (currentSaved) {
        try {
          currentEntries = JSON.parse(currentSaved);
          logger.debug("Read current entries from localStorage", { count: currentEntries.length });
        } catch (e) {
          logger.error("Error parsing current entries, using empty array", e);
          currentEntries = [];
        }
      }
      
      // Merge entries if needed (if another component has written entries since we last read)
      if (isInitializedRef.current && currentEntries.length !== entriesToSave.length) {
        logger.debug("Potential conflict detected, merging entries", { 
          currentCount: currentEntries.length, 
          newCount: entriesToSave.length 
        });
        
        // Create a map of existing entries by ID
        const entriesMap = new Map<string, TimeEntry>();
        entriesToSave.forEach(entry => entriesMap.set(entry.id, entry));
        
        // Add entries that aren't in our local state
        currentEntries.forEach(entry => {
          if (!entriesMap.has(entry.id)) {
            logger.debug("Adding entry from localStorage that's not in local state", { entryId: entry.id });
            entriesMap.set(entry.id, entry);
          }
        });
        
        // Convert map back to array
        entriesToSave = Array.from(entriesMap.values());
        
        // Update local state with merged entries
        setEntries(entriesToSave);
      }
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
      logger.debug("Saved entries to localStorage successfully", { count: entriesToSave.length });
    } catch (error) {
      logger.error("Error saving entries to localStorage:", error);
      toast({
        title: "Error saving data",
        description: "Could not save your timesheet entries. Please try again.",
        variant: "destructive"
      });
    } finally {
      saveInProgressRef.current = false;
    }
  }, [logger]);
  
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) return;
    
    // Clear any pending save operation
    if (saveEntriesRef.current) {
      clearTimeout(saveEntriesRef.current);
    }
    
    // Debounce save operation
    saveEntriesRef.current = setTimeout(() => {
      saveEntriesToStorage(entries);
    }, 300);
    
    return () => {
      if (saveEntriesRef.current) {
        clearTimeout(saveEntriesRef.current);
      }
    };
  }, [entries, isLoading, saveEntriesToStorage]);

  // Add a new entry
  const addEntry = useCallback((entry: TimeEntry) => {
    logger.debug("Adding entry", { entry });
    
    // Validate date before adding
    const entryDate = ensureDate(entry.date);
    if (!entryDate) {
      logger.error("Invalid date in new entry:", entry);
      toast({ 
        title: "Error adding entry", 
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure entry has an ID and valid date
    const entryWithDate = {
      ...entry,
      id: entry.id || uuidv4(),
      date: entryDate
    };
    
    // Add entry to state
    setEntries(prev => {
      // Check if entry already exists (to avoid duplicates)
      const exists = prev.some(e => e.id === entryWithDate.id);
      if (exists) {
        logger.debug("Entry already exists, updating", { entryId: entryWithDate.id });
        return prev.map(e => e.id === entryWithDate.id ? entryWithDate : e);
      }
      return [...prev, entryWithDate];
    });
    
    // Use setTimeout to avoid React state update issues with toast
    setTimeout(() => {
      toast({ 
        title: "Entry added", 
        description: `Added ${entry.hours} hours to your timesheet` 
      });
    }, 10);
  }, [logger]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    logger.debug("Attempting to delete entry", { entryId });
    
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) {
        logger.warn("Entry not found for deletion", { entryId });
        return prev;
      }
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      logger.debug("Entry deleted successfully", { entryId });
      
      // Use setTimeout to avoid React state update issues with toast
      setTimeout(() => {
        toast({
          title: "Entry deleted",
          description: "Time entry has been removed from your timesheet"
        });
      }, 10);
      
      return filteredEntries;
    });
  }, [logger]);

  // Get entries for a specific user
  const getUserEntries = useCallback((userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    // If no viewed user is found, return empty array
    if (!targetUserId) {
      logger.debug("No user ID provided for filtering entries");
      return [];
    }
    
    // Return entries for the viewed user
    const filteredEntries = entries.filter(entry => entry.userId === targetUserId);
    logger.debug("Filtered entries for user", { userId: targetUserId, count: filteredEntries.length });
    return filteredEntries;
  }, [entries, userId, logger]);

  // Get entries for a specific day and user
  const getDayEntries = useCallback((day: Date, userIdToFilter?: string) => {
    // Validate date
    if (!day || !isValidDate(day)) {
      logger.warn("Invalid date provided to getDayEntries", { day });
      return [];
    }
    
    const userEntries = getUserEntries(userIdToFilter);
    const dayFormatted = formatDateForComparison(day);
    
    logger.debug(`Getting entries for date: ${dayFormatted}`, {
      totalUserEntries: userEntries.length
    });
    
    const dayEntries = userEntries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date 
        ? entry.date 
        : ensureDate(entry.date);
      
      if (!entryDate) {
        logger.warn("Invalid date in entry during day filtering:", entry);
        return false;
      }
      
      return areSameDates(entryDate, day);
    });
    
    logger.debug("Retrieved entries for day", { 
      date: dayFormatted, 
      count: dayEntries.length
    });
    
    return dayEntries;
  }, [getUserEntries, logger]);

  // Create a new entry with a UUID
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    // Validate date
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      logger.error("Invalid date in new entry data:", entryData);
      toast({
        title: "Error creating entry",
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return "";
    }
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      date: entryDate
    };
    
    logger.debug("Creating new entry", { entry: newEntry });
    addEntry(newEntry);
    return newEntry.id;
  }, [addEntry, logger]);

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
