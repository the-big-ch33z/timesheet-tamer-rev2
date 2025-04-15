/**
 * Hook for accessing the TimeEntryService
 * Provides a React-friendly way to use the time entry service
 */
import { useState, useEffect, useCallback } from "react";
import { TimeEntry } from "@/types";
import { timeEntryService } from "@/utils/time/services/timeEntryService";
import { useToast } from "./use-toast";
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

/**
 * @deprecated Use useTimesheetData from '@/hooks/timesheet/useTimesheetData' instead.
 * This hook will be removed in a future version.
 */
export const useTimeEntryService = (userId?: string) => {
  deprecationWarning(
    'useTimeEntryService',
    'This hook is deprecated. Please use useTimesheetData from @/hooks/timesheet/useTimesheetData instead.'
  );

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load all entries for the current user
  useEffect(() => {
    if (!userId) return;
    
    const loadEntries = () => {
      const userEntries = timeEntryService.getUserEntries(userId);
      setEntries(userEntries);
      setIsLoading(false);
    };
    
    loadEntries();
    
    // Setup event listeners for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'timeEntries') {
        loadEntries();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);

  // Create a new entry with toast notifications
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    const result = timeEntryService.createEntry({
      ...entryData,
      userId: entryData.userId || userId || ''
    });
    
    if (result) {
      toast({
        title: "Entry added",
        description: `Added ${entryData.hours} hours to your timesheet`
      });
      
      // Refresh entries
      setEntries(timeEntryService.getUserEntries(userId || ''));
      return result;
    } else {
      toast({
        title: "Error adding entry",
        description: "Could not add entry to your timesheet",
        variant: "destructive"
      });
      return null;
    }
  }, [userId, toast]);

  // Update an existing entry with toast notifications
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    const result = timeEntryService.updateEntry(entryId, updates);
    
    if (result) {
      toast({
        title: "Entry updated",
        description: "Your time entry has been updated"
      });
      
      // Refresh entries
      setEntries(timeEntryService.getUserEntries(userId || ''));
      return true;
    } else {
      toast({
        title: "Error updating entry",
        description: "Could not update your time entry",
        variant: "destructive"
      });
      return false;
    }
  }, [userId, toast]);

  // Delete an entry with toast notifications
  const deleteEntry = useCallback((entryId: string) => {
    const result = timeEntryService.deleteEntry(entryId);
    
    if (result) {
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed from your timesheet"
      });
      
      // Refresh entries
      setEntries(timeEntryService.getUserEntries(userId || ''));
      return true;
    } else {
      toast({
        title: "Error deleting entry",
        description: "Could not delete your time entry",
        variant: "destructive"
      });
      return false;
    }
  }, [userId, toast]);

  // Get entries for a specific day
  const getDayEntries = useCallback((date: Date) => {
    if (!userId) return [];
    return timeEntryService.getDayEntries(date, userId);
  }, [userId]);

  // Calculate total hours for a list of entries
  const calculateTotalHours = useCallback((entriesToCalculate?: TimeEntry[]) => {
    const entriesToUse = entriesToCalculate || entries;
    return timeEntryService.calculateTotalHours(entriesToUse);
  }, [entries]);

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    getDayEntries,
    calculateTotalHours
  };
};
