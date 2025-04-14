
import { useCallback } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

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
 * Hook for handling form submissions and entry creation
 */
export const useTimeEntryFormHandling = ({
  formHandlers,
  showEntryForms,
  interactive,
  onCreateEntry,
  startTime,
  endTime,
  calculatedHours,
  refreshForms
}: UseTimeEntryFormHandlingProps) => {
  // Handle form submission
  const handleEntrySubmission = useCallback((entry: any, index: number) => {
    console.debug("[useTimeEntryFormHandling] handleEntrySubmission called:", entry, "at index:", index);
    
    if (!onCreateEntry) {
      console.warn("[useTimeEntryFormHandling] No onCreateEntry function provided, cannot save entry");
      return;
    }
    
    console.debug("[useTimeEntryFormHandling] Saving entry with data from form handler:", entry);
    
    const entryStartTime = entry.startTime || startTime;
    const entryEndTime = entry.endTime || endTime;
    const entryHours = parseFloat(entry.hours.toString()) || calculatedHours;
    
    console.debug("[useTimeEntryFormHandling] Processed entry data:", { 
      startTime: entryStartTime, 
      endTime: entryEndTime, 
      hours: entryHours 
    });
    
    onCreateEntry(
      entryStartTime,
      entryEndTime,
      entryHours
    );
    
    console.debug("[useTimeEntryFormHandling] Entry creation complete");
  }, [onCreateEntry, startTime, endTime, calculatedHours]);

  // Save a specific entry form
  const handleSaveEntry = useCallback((index: number) => {
    console.debug("[useTimeEntryFormHandling] handleSaveEntry called for index:", index);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Not interactive, ignoring save request");
      return;
    }
    
    const formHandler = formHandlers[index];
    if (!formHandler) {
      console.warn("[useTimeEntryFormHandling] No form handler found for index:", index);
      return;
    }

    console.debug("[useTimeEntryFormHandling] Getting form data from handler");
    const formData = formHandler.getFormData();
    
    console.debug("[useTimeEntryFormHandling] Saving entry with data:", formData);
    
    onCreateEntry?.(
      formData.startTime || startTime,
      formData.endTime || endTime,
      parseFloat(formData.hours.toString()) || calculatedHours
    );
    
    console.debug("[useTimeEntryFormHandling] Resetting form state after save");
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    setTimeout(() => {
      console.debug("[useTimeEntryFormHandling] Refreshing forms after save");
      refreshForms();
    }, 100);
  }, [interactive, formHandlers, startTime, endTime, calculatedHours, onCreateEntry, refreshForms]);

  // Save all pending changes across all forms
  const saveAllPendingChanges = useCallback(() => {
    console.debug("[useTimeEntryFormHandling] saveAllPendingChanges called, interactive:", interactive);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Not interactive, ignoring save request");
      return false;
    }
    
    console.debug("[useTimeEntryFormHandling] Checking form handlers for pending changes, showEntryForms:", showEntryForms);
    let changesSaved = false;
    
    formHandlers.forEach((handler, index) => {
      if (!handler) {
        console.debug(`[useTimeEntryFormHandling] No handler at index ${index}`);
        return;
      }
      
      console.debug(`[useTimeEntryFormHandling] Checking handler at index ${index}, form in showEntryForms:`, showEntryForms.includes(index));
      
      if (handler && showEntryForms.includes(index)) {
        // Check if saveIfEdited returns true (indicating changes were saved)
        const wasSaved = handler.saveIfEdited();
        console.debug(`[useTimeEntryFormHandling] Handler ${index} saveIfEdited returned:`, wasSaved);
        
        if (wasSaved === true) {
          console.debug(`[useTimeEntryFormHandling] Saved pending changes in form handler ${index}`);
          changesSaved = true;
        }
      }
    });
    
    if (changesSaved) {
      // Refresh forms after saving to ensure clean state
      console.debug("[useTimeEntryFormHandling] Changes were saved, refreshing forms");
      setTimeout(refreshForms, 100);
    } else {
      console.debug("[useTimeEntryFormHandling] No changes were saved");
    }
    
    return changesSaved;
  }, [formHandlers, showEntryForms, interactive, refreshForms]);

  return {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  };
};
