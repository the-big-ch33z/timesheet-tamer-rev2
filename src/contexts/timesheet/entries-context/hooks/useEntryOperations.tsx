
import { useState, useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ensureDate } from "@/utils/time/validation";

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
    console.debug("[TimeEntryProvider] Adding new entry:", entryData);
    
    // Validate date before adding
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      console.error("[TimeEntryProvider] Invalid date in new entry:", entryData);
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

    console.debug("[TimeEntryProvider] Created entry with ID:", newEntry.id);
    
    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      console.debug("[TimeEntryProvider] Updated entries array, new length:", newEntries.length);
      return newEntries;
    });
    
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [setEntries, toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    console.debug("[TimeEntryProvider] Updating entry:", entryId, "with updates:", updates);
    
    // Validate date if it's being updated
    if (updates.date) {
      const validDate = ensureDate(updates.date);
      if (!validDate) {
        console.error("[TimeEntryProvider] Invalid date in update:", updates);
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
        console.warn("[TimeEntryProvider] Entry not found for update:", entryId);
        return prev;
      }
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      console.debug("[TimeEntryProvider] Entry updated successfully");
      return updatedEntries;
    });
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [setEntries, toast]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    console.debug("[TimeEntryProvider] Attempting to delete entry:", entryId);
    
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) {
        console.warn("[TimeEntryProvider] Entry not found for deletion:", entryId);
        return prev;
      }
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      console.debug("[TimeEntryProvider] Entry deleted, remaining entries:", filteredEntries.length);
      
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed from your timesheet"
      });
      
      return filteredEntries;
    });
  }, [setEntries, toast]);

  return {
    addEntry,
    updateEntry,
    deleteEntry
  };
};
