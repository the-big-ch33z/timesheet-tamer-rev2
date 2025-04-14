
import { TimeEntry } from "@/types";
import { useLogger } from "../../useLogger";
import { toast } from "@/hooks/use-toast";
import { ensureDate } from "@/utils/time/validation";

// Storage key constant to ensure consistency
export const STORAGE_KEY = 'timeEntries';

// Load entries from localStorage
export const loadEntriesFromStorage = (logger: ReturnType<typeof useLogger>) => {
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
      logger.debug("Loaded entries from localStorage", { count: parsedEntries.length });
      return parsedEntries;
    } else {
      logger.debug("No entries found in localStorage");
      // Initialize with empty array to prevent future save/load cycles
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    logger.error("Error loading entries:", error);
    toast({
      title: "Error loading data",
      description: "Could not load your timesheet entries. Please refresh the page.",
      variant: "destructive"
    });
    return [];
  }
};

// Save entries with debounce and lock handling
export const createEntrySaver = (logger: ReturnType<typeof useLogger>) => {
  const saveInProgressRef = { current: false };
  
  return {
    saveEntriesToStorage: (entriesToSave: TimeEntry[], isInitialized: boolean) => {
      // Prevent simultaneous writes
      if (saveInProgressRef.current) {
        logger.debug("Another save operation in progress, scheduling retry");
        return false;
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
        if (isInitialized && currentEntries.length !== entriesToSave.length) {
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
        }
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
        logger.debug("Saved entries to localStorage successfully", { count: entriesToSave.length });
        return true;
      } catch (error) {
        logger.error("Error saving entries to localStorage:", error);
        toast({
          title: "Error saving data",
          description: "Could not save your timesheet entries. Please try again.",
          variant: "destructive"
        });
        return false;
      } finally {
        saveInProgressRef.current = false;
      }
    }
  };
};
