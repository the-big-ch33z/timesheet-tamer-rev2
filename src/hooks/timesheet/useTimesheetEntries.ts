
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";
import { toast } from "@/hooks/use-toast";

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
    setEntries(prev => [...prev, entry]);
    
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
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      
      if (filteredEntries.length < prev.length) {
        logger.debug("Entry deleted successfully", { entryId });
        
        // Use setTimeout to avoid React state update issues with toast
        setTimeout(() => {
          toast({
            title: "Entry deleted",
            description: "Time entry has been removed from your timesheet"
          });
        }, 10);
      } else {
        logger.warn("Entry not found for deletion", { entryId });
      }
      
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
    
    const dayEntries = userEntries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date 
        ? entry.date 
        : new Date(entry.date);
      
      const entryDateFormatted = format(entryDate, "yyyy-MM-dd");
      const isMatch = entryDateFormatted === dayFormatted;
      
      return isMatch;
    });
    
    logger.debug("Retrieved entries for day", { 
      date: format(day, "yyyy-MM-dd"), 
      count: dayEntries.length,
      entries: dayEntries
    });
    
    return dayEntries;
  }, [getUserEntries, logger]);

  return {
    entries,
    getUserEntries,
    getDayEntries,
    addEntry,
    deleteEntry
  };
};
