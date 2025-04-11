
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from "../useLogger";

export const useEntryManagement = (userId?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();
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

  // Listen for new entries added
  useEffect(() => {
    const handleEntryAdded = (event: any) => {
      const newEntry = event.detail;
      if (newEntry) {
        setEntries(prev => [...prev, newEntry]);
        logger.info("New entry added", { entry: newEntry });
      }
    };
    
    document.addEventListener('entry-added', handleEntryAdded);
    
    return () => {
      document.removeEventListener('entry-added', handleEntryAdded);
    };
  }, [logger]);

  // Save entries to localStorage when they change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      logger.debug("Saved entries to localStorage", { count: entries.length });
    }
  }, [entries, logger]);

  const addEntry = (entry: TimeEntry) => {
    // Ensure the entry has the correct userId
    const completeEntry = {
      ...entry,
      userId: entry.userId || userId // Use the entry's userId if provided, otherwise use the hook's userId
    };
    
    setEntries(prev => [...prev, completeEntry]);
    logger.info("Entry added explicitly", { entry: completeEntry });
    
    // Create a custom event to notify about the new entry
    const event = new CustomEvent('entry-added', {
      detail: completeEntry
    });
    document.dispatchEvent(event);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    logger.info("Entry deleted", { id });
    
    toast({
      title: "Entry deleted",
      description: "Time entry has been removed",
    });
  };

  const getUserEntries = (userIdToFilter?: string) => {
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
  };

  const getDayEntries = (day: Date, userIdToFilter?: string) => {
    const userEntries = getUserEntries(userIdToFilter);
    const dayEntries = userEntries.filter(
      (entry) => format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    logger.debug("Retrieved entries for day", { 
      date: format(day, "yyyy-MM-dd"), 
      count: dayEntries.length 
    });
    return dayEntries;
  };

  return {
    entries,
    deleteEntry,
    getUserEntries,
    getDayEntries,
    addEntry
  };
};
