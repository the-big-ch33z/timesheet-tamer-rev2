
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useLogger } from "../../useLogger";
import { ensureDate } from "@/utils/time/validation";

// Add a new entry
export const createEntryOperations = (
  setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>,
  logger: ReturnType<typeof useLogger>
) => {
  // Add a new entry
  const addEntry = (entry: TimeEntry) => {
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
    // But preserve ALL other fields from the original entry
    const entryWithDate = {
      ...entry,
      id: entry.id || uuidv4(),
      date: entryDate
    };
    
    // Log the complete entry that will be added to ensure all fields are present
    logger.debug("Completed entry before adding:", entryWithDate);
    
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
  };

  // Delete an entry
  const deleteEntry = (entryId: string) => {
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
  };

  // Create a new entry with a UUID - preserve all input fields
  const createEntry = (entryData: Omit<TimeEntry, "id">) => {
    // Log received data for verification
    logger.debug("Creating new entry with data:", entryData);
    
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
    
    // Create new entry object with all fields preserved
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      date: entryDate
    };
    
    logger.debug("Finalized new entry:", newEntry);
    addEntry(newEntry);
    return newEntry.id;
  };

  return {
    addEntry,
    deleteEntry,
    createEntry
  };
};
