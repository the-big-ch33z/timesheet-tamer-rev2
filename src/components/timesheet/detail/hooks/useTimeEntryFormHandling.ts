
import { useCallback, useRef, useEffect } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
 * Enhanced with improved save event handling
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
  const { toast } = useToast();
  const lastSaveTime = useRef<number>(0);
  
  // Setup event listener for global save events
  useEffect(() => {
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Not interactive, skipping event listener setup");
      return;
    }
    
    const handleGlobalSaveEvent = () => {
      console.debug("[useTimeEntryFormHandling] Received global save event");
      saveAllPendingChanges();
    };
    
    console.debug("[useTimeEntryFormHandling] Setting up global save event listener");
    window.addEventListener('timesheet:save-pending-changes', handleGlobalSaveEvent);
    
    return () => {
      console.debug("[useTimeEntryFormHandling] Removing global save event listener");
      window.removeEventListener('timesheet:save-pending-changes', handleGlobalSaveEvent);
    };
  }, [interactive]);

  // Enhanced entry submission with validation
  const handleEntrySubmission = useCallback((entry: TimeEntry, index: number) => {
    console.debug(`[useTimeEntryFormHandling] Entry submission for index ${index}, interactive=${interactive}`, entry);
    
    // Check if interactive mode is disabled
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting submission");
      return;
    }
    
    // Validate required fields before submission
    if (!entry.hours) {
      console.debug("[useTimeEntryFormHandling] Missing hours in entry submission");
      toast({
        title: "Hours are required",
        description: "Please enter the number of hours before saving",
        variant: "destructive"
      });
      return;
    }

    // Don't submit completely empty entries
    if (!entry.hours && !entry.description && !entry.jobNumber && !entry.rego && !entry.taskNumber) {
      console.debug("[useTimeEntryFormHandling] Skipping empty entry submission");
      toast({
        title: "Cannot save empty entry",
        description: "Please add some details to your entry before saving",
        variant: "destructive"
      });
      return;
    }

    // Create entry if onCreateEntry is provided
    if (onCreateEntry) {
      console.debug("[useTimeEntryFormHandling] Creating entry with onCreateEntry:", entry);
      
      // We use the saved entry data to create a new entry
      onCreateEntry(entry.startTime || startTime, entry.endTime || endTime, entry.hours);
      
      // Toast notification for user feedback
      toast({
        title: "Entry created",
        description: `Added ${entry.hours} hours to your timesheet`,
      });
      
      // Reset the form and refresh the form list
      formHandlers[index].resetForm();
      refreshForms();
      
      // Update last save time
      lastSaveTime.current = Date.now();
    } else {
      console.debug("[useTimeEntryFormHandling] No onCreateEntry function provided");
      toast({
        title: "Could not save entry",
        description: "The save function is not available",
        variant: "destructive"
      });
    }
  }, [interactive, onCreateEntry, startTime, endTime, formHandlers, refreshForms, toast]);

  // Enhanced save entry with improved validation
  const handleSaveEntry = useCallback((index: number) => {
    console.debug(`[useTimeEntryFormHandling] handleSaveEntry called for index ${index}, interactive=${interactive}`);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting save");
      return;
    }
    
    if (index < 0 || index >= formHandlers.length) {
      console.error(`[useTimeEntryFormHandling] Invalid index: ${index}`);
      toast({
        title: "Error",
        description: "Could not save entry due to an invalid form reference",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicate save
    const now = Date.now();
    if (now - lastSaveTime.current < 300) {
      console.debug("[useTimeEntryFormHandling] Preventing duplicate save operation");
      return;
    }

    // Check if the form has content before saving
    const formState = formHandlers[index].formState;
    const hasContent = !!(formState.hours || formState.description || formState.jobNumber || 
                         formState.rego || formState.taskNumber);
                         
    if (!hasContent) {
      console.debug("[useTimeEntryFormHandling] Preventing save of empty form");
      toast({
        title: "Cannot save empty entry",
        description: "Please add some details to your entry before saving",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields
    if (!formState.hours) {
      console.debug("[useTimeEntryFormHandling] Missing hours in save operation");
      toast({
        title: "Hours are required",
        description: "Please enter the number of hours before saving",
        variant: "destructive"
      });
      return;
    }
    
    // All validation passed, proceed with save
    formHandlers[index].handleSave();
    lastSaveTime.current = now;
    
  }, [interactive, formHandlers, toast]);

  // Save all pending changes with enhanced error handling
  const saveAllPendingChanges = useCallback(() => {
    console.debug(`[useTimeEntryFormHandling] saveAllPendingChanges called, interactive=${interactive}, forms shown=${showEntryForms.length}`);
    
    if (!interactive) {
      console.debug("[useTimeEntryFormHandling] Interactive mode disabled, aborting save all");
      return false;
    }
    
    // Check for duplicate save operation
    const now = Date.now();
    if (now - lastSaveTime.current < 300) {
      console.debug("[useTimeEntryFormHandling] Preventing duplicate saveAll operation");
      return false;
    }
    
    try {
      let changesSaved = false;
      let errors = 0;
      
      // Save any pending changes in visible forms
      showEntryForms.forEach(index => {
        if (index < 0 || index >= formHandlers.length) {
          console.error(`[useTimeEntryFormHandling] Invalid form index: ${index}`);
          return;
        }
        
        // Only attempt to save forms that have content and have been edited
        const formState = formHandlers[index].formState;
        const hasContent = !!(formState.hours || formState.description || formState.jobNumber || 
                            formState.rego || formState.taskNumber);
        
        if (hasContent && formState.formEdited) {
          // Check if hours is provided (required field)
          if (!formState.hours) {
            console.debug(`[useTimeEntryFormHandling] Form ${index} is missing required hours field`);
            errors++;
            return;
          }
          
          const saved = formHandlers[index].saveIfEdited();
          changesSaved = changesSaved || saved;
          
          if (saved) {
            console.debug(`[useTimeEntryFormHandling] Saved changes for form ${index}`);
          }
        } else {
          console.debug(`[useTimeEntryFormHandling] Skipping save for form ${index} (no content or not edited)`);
        }
      });
      
      if (errors > 0) {
        toast({
          title: `${errors} ${errors === 1 ? 'entry' : 'entries'} not saved`,
          description: "Please enter hours for all entries before saving",
          variant: "destructive"
        });
      }
      
      if (!changesSaved && errors === 0) {
        console.debug("[useTimeEntryFormHandling] No changes needed saving");
      }
      
      // Update last save time
      lastSaveTime.current = now;
      return changesSaved;
    } catch (error) {
      console.error("[useTimeEntryFormHandling] Error saving changes:", error);
      toast({
        title: "Error saving changes",
        description: "Some changes could not be saved. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [interactive, showEntryForms, formHandlers, toast]);

  return {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  };
};
