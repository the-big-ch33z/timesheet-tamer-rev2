
import { useCallback } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/useTimeEntryForm";
import { TimeEntry } from "@/types";

interface UseTimeEntryFormHandlingProps {
  formHandlers: UseTimeEntryFormReturn[];
  showEntryForms: number[];
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  refreshForms: () => void;
}

/**
 * Hook to handle form submissions and entry creation
 */
export const useTimeEntryFormHandling = ({
  formHandlers,
  showEntryForms,
  interactive,
  onCreateEntry,
  startTime,
  endTime,
  calculatedHours,
  refreshForms,
}: UseTimeEntryFormHandlingProps) => {

  // Handle entry submission
  const handleEntrySubmission = useCallback((entry: TimeEntry, index: number) => {
    console.debug(`[useTimeEntryFormHandling] Entry submission for index ${index}, interactive=${interactive}`);
    
    // Check if interactive mode is disabled
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting submission");
      return;
    }

    // Create entry if onCreateEntry is provided
    if (onCreateEntry) {
      console.debug("[useTimeEntryFormHandling] Creating entry:", entry);
      onCreateEntry(startTime, endTime, entry.hours);
    } else {
      console.debug("[useTimeEntryFormHandling] No onCreateEntry function provided");
    }

    // Reset the form and refresh the form list
    formHandlers[index].resetForm();
    refreshForms();
  }, [interactive, onCreateEntry, startTime, endTime, formHandlers, refreshForms]);

  // Handle save entry (wrapper for form handler)
  const handleSaveEntry = useCallback((index: number) => {
    console.debug(`[useTimeEntryFormHandling] handleSaveEntry called for index ${index}, interactive=${interactive}`);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting save");
      return;
    }
    
    if (index < 0 || index >= formHandlers.length) {
      console.error(`[useTimeEntryFormHandling] Invalid index: ${index}`);
      return;
    }
    
    formHandlers[index].handleSave();
  }, [interactive, formHandlers]);

  // Save all pending changes
  const saveAllPendingChanges = useCallback(() => {
    console.debug(`[useTimeEntryFormHandling] saveAllPendingChanges called, interactive=${interactive}, forms shown=${showEntryForms.length}`);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting save all");
      return;
    }
    
    let changesSaved = false;
    
    // Save any pending changes in visible forms
    showEntryForms.forEach(index => {
      if (index < 0 || index >= formHandlers.length) {
        console.error(`[useTimeEntryFormHandling] Invalid form index: ${index}`);
        return;
      }
      
      const saved = formHandlers[index].saveIfEdited();
      changesSaved = changesSaved || saved;
      
      if (saved) {
        console.debug(`[useTimeEntryFormHandling] Saved changes for form ${index}`);
      }
    });
    
    if (!changesSaved) {
      console.debug("[useTimeEntryFormHandling] No changes needed saving");
    }
    
    return changesSaved;
  }, [interactive, showEntryForms, formHandlers]);

  return {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  };
};
