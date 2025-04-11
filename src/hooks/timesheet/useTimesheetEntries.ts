
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from "../useLogger";
import { v4 as uuidv4 } from "uuid";

/**
 * Unified hook for managing timesheet entries
 * Handles loading, saving, adding, updating, and deleting entries
 */
export const useTimesheetEntries = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();
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
    if (entries.length > 0) {
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      logger.debug("Saved entries to localStorage", { count: entries.length });
    }
  }, [entries, logger]);

  // Add a new entry
  const addEntry = useCallback((entry: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      userId: entry.userId || userId || ""
    };
    
    setEntries(prev => [...prev, newEntry]);
    logger.info("Entry added", { entry: newEntry });
    
    toast({
      title: "Entry added",
      description: "Time entry has been saved successfully",
      variant: "default",
      className: "bg-green-50 border-green-200"
    });
    
    return newEntry;
  }, [userId, logger, toast]);

  // Delete an existing entry
  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    logger.info("Entry deleted", { id });
    
    toast({
      title: "Entry deleted",
      description: "Time entry has been removed",
    });
  }, [toast, logger]);

  // Update an existing entry
  const updateEntry = useCallback((id: string, updatedEntry: Partial<TimeEntry>) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === id 
          ? { ...entry, ...updatedEntry, userId: updatedEntry.userId || entry.userId || userId || "" } 
          : entry
      )
    );
    logger.info("Entry updated", { id, updatedEntry });
    
    toast({
      title: "Entry updated",
      description: "Time entry has been updated",
    });
  }, [userId, toast, logger]);

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
    const dayEntries = userEntries.filter(
      (entry) => format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    logger.debug("Retrieved entries for day", { 
      date: format(day, "yyyy-MM-dd"), 
      count: dayEntries.length 
    });
    return dayEntries;
  }, [getUserEntries, logger]);

  return {
    entries,
    addEntry,
    deleteEntry,
    updateEntry,
    getUserEntries,
    getDayEntries,
  };
};
