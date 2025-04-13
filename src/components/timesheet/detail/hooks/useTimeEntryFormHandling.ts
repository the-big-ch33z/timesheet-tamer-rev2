
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
    if (onCreateEntry) {
      console.log("Saving entry with data from form handler:", entry, "at index:", index);
      onCreateEntry(
        entry.startTime || startTime,
        entry.endTime || endTime,
        parseFloat(entry.hours.toString()) || calculatedHours
      );
    }
  }, [onCreateEntry, startTime, endTime, calculatedHours]);

  // Save a specific entry form
  const handleSaveEntry = useCallback((index: number) => {
    if (!interactive || !formHandlers[index]) return;

    const formHandler = formHandlers[index];
    const formData = formHandler.getFormData();
    
    console.log("Saving entry with data:", formData);
    
    onCreateEntry?.(
      formData.startTime || startTime,
      formData.endTime || endTime,
      parseFloat(formData.hours.toString()) || calculatedHours
    );
    
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    setTimeout(() => {
      console.log("Refreshing forms after save");
      refreshForms();
    }, 100);
  }, [interactive, formHandlers, startTime, endTime, calculatedHours, onCreateEntry, refreshForms]);

  // Save all pending changes across all forms
  const saveAllPendingChanges = useCallback(() => {
    if (!interactive) return false;
    
    console.log("Checking all form handlers for pending changes");
    let changesSaved = false;
    
    formHandlers.forEach((handler, index) => {
      if (handler && showEntryForms.includes(index)) {
        // Fix: Explicitly check the boolean return value
        const wasSaved = handler.saveIfEdited();
        if (wasSaved === true) {
          console.log(`Saved pending changes in form handler ${index}`);
          changesSaved = true;
        }
      }
    });
    
    if (changesSaved) {
      // Refresh forms after saving to ensure clean state
      setTimeout(refreshForms, 100);
    }
    
    return changesSaved;
  }, [formHandlers, showEntryForms, interactive, refreshForms]);

  return {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  };
};
