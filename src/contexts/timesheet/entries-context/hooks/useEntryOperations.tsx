
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ensureDate } from "@/utils/time/validation";
import { unifiedTimeEntryService } from "@/utils/time/services";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";
import { format } from "date-fns";

const logger = createTimeLogger('useEntryOperations');

/**
 * Utility to create standard event payload for TOIL-related operations
 */
const createTOILEventPayload = (userId?: string, entryId?: string) => {
  const now = new Date();
  return {
    userId,
    entryId,
    timestamp: Date.now(),
    date: format(now, 'yyyy-MM-dd'),
    monthYear: format(now, 'yyyy-MM'),
    requiresRefresh: true,
    source: 'entry-operations',
    status: 'completed'
  };
};

/**
 * Hook that provides operations for manipulating time entries
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
    
    // If this is a TOIL entry (jobNumber === 'TOIL'), trigger a TOIL calculation
    if (entryData.jobNumber === 'TOIL') {
      logger.debug("[TimeEntryProvider] TOIL entry added, triggering TOIL calculation");
      eventBus.publish(TOIL_EVENTS.CALCULATED, 
        createTOILEventPayload(entryData.userId, newEntry.id), 
        { debounce: 50 }
      );
    }
    
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
    
    let userId: string | undefined;
    let isTOILEntry = false;
    
    setEntries(prev => {
      const entryIndex = prev.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn("[TimeEntryProvider] Entry not found for update:", entryId);
        return prev;
      }
      
      // Store the user ID for event dispatch
      userId = prev[entryIndex].userId || updates.userId;
      
      // Check if this is a TOIL entry or being updated to be one
      isTOILEntry = 
        prev[entryIndex].jobNumber === 'TOIL' || 
        updates.jobNumber === 'TOIL';
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      logger.debug("[TimeEntryProvider] Entry updated successfully");
      return updatedEntries;
    });
    
    // If this is a TOIL entry, trigger a TOIL calculation
    if (isTOILEntry) {
      logger.debug("[TimeEntryProvider] TOIL entry updated, triggering TOIL calculation");
      eventBus.publish(TOIL_EVENTS.CALCULATED, 
        createTOILEventPayload(userId, entryId), 
        { debounce: 50 }
      );
    }
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [setEntries, toast]);

  // Delete an entry - now fully async to support TOIL cleanup
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    logger.debug("[TimeEntryProvider] Attempting to delete entry:", entryId);
    
    try {
      // First, find the entry to get its user ID and check if it's a TOIL entry
      let userId: string | undefined;
      let isTOILEntry = false;
      
      const entryToDelete = entries.find(entry => entry.id === entryId);
      if (entryToDelete) {
        userId = entryToDelete.userId;
        isTOILEntry = entryToDelete.jobNumber === 'TOIL';
        logger.debug(`[TimeEntryProvider] Found entry to delete: userId=${userId}, isTOIL=${isTOILEntry}`);
      }
      
      // Track the deletion in the service which now waits for TOIL cleanup
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
      
      // If this was a TOIL entry, explicitly trigger a TOIL calculation event
      if (isTOILEntry) {
        logger.debug("[TimeEntryProvider] TOIL entry deleted, triggering TOIL calculation");
        eventBus.publish(TOIL_EVENTS.CALCULATED, 
          createTOILEventPayload(userId, entryId), 
          { debounce: 50 }
        );
      }
      
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
