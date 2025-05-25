
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ensureDate } from "@/utils/time/validation";
import { unifiedTimeEntryService } from "@/utils/time/services";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";

const logger = createTimeLogger('useEntryOperations');

/**
 * Hook that provides operations for manipulating time entries
 * OPTIMIZED: Removed redundant TOIL event dispatching to prevent timing conflicts
 */
export const useEntryOperations = (
  entries: TimeEntry[],
  setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>
) => {
  const { toast } = useToast();

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    logger.debug("[TimeEntryProvider] Adding new entry:", entryData);
    
    // Validate date before adding
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      logger.error("[TimeEntryProvider] Invalid date in new entry:", entryData);
      toast({
        title: "Error adding entry",
        description: "The entry has an invalid date.",
        variant: "destructive"
      });
      return;
    }
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      date: entryDate
    };

    logger.debug("[TimeEntryProvider] Created entry with ID:", newEntry.id);
    
    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      logger.debug("[TimeEntryProvider] Updated entries array, new length:", newEntries.length);
      return newEntries;
    });
    
    // Service layer will handle TOIL events, no need to dispatch here
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [setEntries, toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    logger.debug("[TimeEntryProvider] Updating entry:", entryId, "with updates:", updates);
    
    // Validate date if it's being updated
    if (updates.date) {
      const validDate = ensureDate(updates.date);
      if (!validDate) {
        logger.error("[TimeEntryProvider] Invalid date in update:", updates);
        toast({
          title: "Error updating entry",
          description: "The entry has an invalid date.",
          variant: "destructive"
        });
        return;
      }
      updates.date = validDate;
    }
    
    setEntries(prev => {
      const entryIndex = prev.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn("[TimeEntryProvider] Entry not found for update:", entryId);
        return prev;
      }
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      logger.debug("[TimeEntryProvider] Entry updated successfully");
      return updatedEntries;
    });
    
    // Service layer will handle TOIL events, no need to dispatch here
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [setEntries, toast]);

  // Delete an entry - now delegates to service layer for proper TOIL cleanup
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    logger.debug("[TimeEntryProvider] Attempting to delete entry:", entryId);
    
    try {
      // Find the entry to get its user ID
      const entryToDelete = entries.find(entry => entry.id === entryId);
      if (entryToDelete) {
        logger.debug(`[TimeEntryProvider] Found entry to delete: userId=${entryToDelete.userId}`);
      }
      
      // Use the service which handles TOIL cleanup and event coordination
      const serviceDeleted = await unifiedTimeEntryService.deleteEntry(entryId);
      
      if (!serviceDeleted) {
        logger.warn("[TimeEntryProvider] Service deletion failed for entry:", entryId);
        return false;
      }
      
      // Only update UI state after service succeeds
      let success = false;
      
      setEntries(prev => {
        if (!prev.some(entry => entry.id === entryId)) {
          logger.warn("[TimeEntryProvider] Entry not found for deletion in UI state:", entryId);
          return prev;
        }
        
        const filteredEntries = prev.filter(entry => entry.id !== entryId);
        success = true;
        
        logger.debug("[TimeEntryProvider] Entry deleted from UI state, remaining entries:", filteredEntries.length);
        return filteredEntries;
      });
      
      // Service layer handles all TOIL events and calculations
      if (success) {
        toast({
          title: "Entry deleted",
          description: "Time entry has been removed from your timesheet"
        });
      }
      
      return success;
    } catch (error) {
      logger.error("[TimeEntryProvider] Error deleting entry:", error);
      toast({
        title: "Error deleting entry",
        description: "An unexpected error occurred"
      });
      return false;
    }
  }, [entries, setEntries, toast]);

  // Create a new entry with validation
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">): string | null => {
    logger.debug("[TimeEntryProvider] Creating new entry with data:", entryData);
    
    // Validate the entry data
    if (!entryData.userId) {
      logger.error("[TimeEntryProvider] Missing userId in entry data:", entryData);
      toast({
        title: "Error creating entry",
        description: "Missing user information for the entry",
        variant: "destructive"
      });
      return null;
    }
    
    // Add the entry
    const newId = uuidv4();
    const entryWithId = { 
      ...entryData,
      id: newId
    } as TimeEntry;
    
    addEntry(entryData);
    return newId;
  }, [addEntry, toast]);

  return {
    addEntry,
    updateEntry,
    deleteEntry,
    createEntry
  };
};
