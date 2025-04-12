
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useLogger } from "../useLogger";

export const useEntryManagement = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const logger = useLogger("EntryManagement");
  
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
    getDayEntries
  };
};
