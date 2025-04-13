
import { useState, useEffect, useCallback } from "react";
import { format, isEqual, parseISO } from "date-fns";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

/**
 * Simplified hook for managing timesheet entries
 * Only handles loading and viewing entries
 */
export const useTimesheetEntries = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const logger = useLogger("TimesheetEntries");
  
  // Load entries from localStorage
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('timeEntries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        setEntries(parsedEntries);
        logger.debug("Loaded entries from localStorage", { count: parsedEntries.length });
      }
    } catch (error) {
      logger.error("Error loading entries:", error);
    }
  }, [logger]);

  // Save entries to localStorage when they change
  useEffect(() => {
    // Save entries whether empty or not to properly handle deletion
    localStorage.setItem('timeEntries', JSON.stringify(entries));
    logger.debug("Saved entries to localStorage", { count: entries.length });
  }, [entries, logger]);

  // Add a new entry
  const addEntry = useCallback((entry: TimeEntry) => {
    logger.debug("Adding entry", { entry });
    
    // Ensure date is a Date object
    const entryWithDate = {
      ...entry,
      id: entry.id || uuidv4(), // Ensure entry has an ID
      date: entry.date instanceof Date ? entry.date : new Date(entry.date)
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
    const userEntries = getUserEntries(userIdToFilter);
    const dayFormatted = format(day, "yyyy-MM-dd");
    
    logger.debug(`Getting entries for date: ${dayFormatted}`, {
      totalUserEntries: userEntries.length
    });
    
    const dayEntries = userEntries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date 
        ? entry.date 
        : new Date(entry.date);
      
      const entryDateFormatted = format(entryDate, "yyyy-MM-dd");
      
      const isMatch = entryDateFormatted === dayFormatted;
      logger.debug(`Entry date: ${entryDateFormatted}, target: ${dayFormatted}, match: ${isMatch}`, {
        entry: entry.id
      });
      
      return isMatch;
    });
    
    logger.debug("Retrieved entries for day", { 
      date: dayFormatted, 
      count: dayEntries.length
    });
    
    return dayEntries;
  }, [getUserEntries, logger]);

  // Create a new entry with a UUID
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4()
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
    createEntry
  };
};
