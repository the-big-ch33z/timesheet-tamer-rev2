
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";

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
    getUserEntries,
    getDayEntries,
    // These are kept as no-op functions to maintain interface compatibility
    addEntry: () => logger.info("Add entry functionality has been removed"),
    deleteEntry: () => logger.info("Delete entry functionality has been removed"),
    updateEntry: () => logger.info("Update entry functionality has been removed"),
  };
};
