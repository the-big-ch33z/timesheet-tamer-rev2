
import { useState, useEffect, useCallback, useRef } from "react";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { areSameDates, formatDateForComparison, ensureDate, isValidDate } from "@/utils/time/validation";

/**
 * Simplified hook for managing timesheet entries
 * Only handles loading and viewing entries
 */
export const useTimesheetEntries = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const logger = useLogger("TimesheetEntries");
  
  // Load entries from localStorage only once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    try {
      logger.debug("Loading entries from localStorage");
      const savedEntries = localStorage.getItem('timeEntries');
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
        localStorage.setItem('timeEntries', JSON.stringify([]));
      }
    } catch (error) {
      logger.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [logger]);

  // Save entries to localStorage when they change - with debounce
  const saveEntriesRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) return;
    
    // Clear any pending save operation
    if (saveEntriesRef.current) {
      clearTimeout(saveEntriesRef.current);
    }
    
    // Debounce save operation
    saveEntriesRef.current = setTimeout(() => {
      try {
        logger.debug("Saving entries to localStorage", { count: entries.length });
        localStorage.setItem('timeEntries', JSON.stringify(entries));
        logger.debug("Saved entries to localStorage successfully");
      } catch (error) {
        logger.error("Error saving entries to localStorage:", error);
      }
    }, 300);
    
    return () => {
      if (saveEntriesRef.current) {
        clearTimeout(saveEntriesRef.current);
      }
    };
  }, [entries, isLoading, logger]);

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
