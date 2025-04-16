
import { useCallback } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import { useToast } from "@/hooks/use-toast";
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useUnifiedTimeEntries } from "@/hooks/useUnifiedTimeEntries";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

interface UseTimeEntryFormHandlingProps {
  formHandlers: UseTimeEntryFormReturn[];
  showEntryForms: boolean[];
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  refreshForms: () => void;
}

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
  const { toast } = useToast();
  const { createEntry } = useUnifiedTimeEntries();
  
  // Handle entry submission from a form
  const handleEntrySubmission = useCallback((entry: any, index: number) => {
    if (!interactive) {
      console.log("[useTimeEntryFormHandling] Not in interactive mode, ignoring submission");
      return;
    }
    
    console.log(`[useTimeEntryFormHandling] Handling submission from form ${index}`, entry);
    
    try {
      // Create the entry using the service
      const entryId = createEntry({
        date: entry.date,
        userId: entry.userId,
        hours: entry.hours,
        description: entry.description || "",
        jobNumber: entry.jobNumber || "",
        taskNumber: entry.taskNumber || "",
        project: entry.project || "General",
        rego: entry.rego || "",
      });
      
      if (entryId) {
        toast({
          title: "Entry added",
          description: "Your time entry has been added successfully"
        });
        
        // If there's a callback, call it
        if (onCreateEntry && entry.startTime && entry.endTime) {
          onCreateEntry(entry.startTime, entry.endTime, entry.hours);
        }
        
        // Trigger a refresh event
        timeEventsService.dispatch('entry-created', {
          entryId,
          userId: entry.userId,
          date: entry.date,
          hours: entry.hours
        });
        
        // Refresh forms to show success
        refreshForms();
        
        return entryId;
      } else {
        toast({
          title: "Error",
          description: "Failed to add time entry",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error("[useTimeEntryFormHandling] Error handling submission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    }
  }, [interactive, createEntry, toast, onCreateEntry, refreshForms]);
  
  // Handle save button click from a specific form
  const handleSaveEntry = useCallback((index: number) => {
    console.log(`[useTimeEntryFormHandling] Save clicked for form ${index}`);
    
    if (!interactive || index < 0 || index >= formHandlers.length) {
      console.log("[useTimeEntryFormHandling] Invalid form index or not interactive");
      return;
    }
    
    // Get the form handler
    const formHandler = formHandlers[index];
    
    if (!formHandler) {
      console.warn("[useTimeEntryFormHandling] Form handler not found for index", index);
      return;
    }
    
    // Check if form values are present
    if (!formHandler.formState.hours) {
      // Auto-populate from start/end times if available
      if (startTime && endTime && calculatedHours > 0) {
        formHandler.updateTimes(startTime, endTime);
        formHandler.setHoursFromTimes();
      } else {
        toast({
          title: "Missing hours",
          description: "Please enter hours or start/end times",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Use handleSave instead of handleSubmit
    formHandler.handleSave();
  }, [formHandlers, interactive, startTime, endTime, calculatedHours, toast]);
  
  // Save all pending changes across all visible form handlers
  const saveAllPendingChanges = useCallback(() => {
    console.log("[useTimeEntryFormHandling] Saving all pending changes");
    
    if (!interactive) return;
    
    // Loop through all visible forms
    let savedCount = 0;
    
    formHandlers.forEach((handler, index) => {
      // Only process visible and edited forms
      if (showEntryForms[index] && handler.formState.formEdited) {
        console.log(`[useTimeEntryFormHandling] Form ${index} is edited, submitting`);
        
        // Auto-populate hours from start/end times if needed
        if (!handler.formState.hours && startTime && endTime) {
          handler.updateTimes(startTime, endTime);
          handler.setHoursFromTimes();
        }
        
        // Use handleSave instead of handleSubmit
        if (handler.formState.hours) {
          handler.handleSave();
          savedCount++;
        }
      }
    });
    
    if (savedCount > 0) {
      toast({
        title: "Changes saved",
        description: `Saved ${savedCount} time ${savedCount === 1 ? 'entry' : 'entries'}`
      });
    }
    
    return savedCount;
  }, [formHandlers, showEntryForms, interactive, startTime, endTime, toast]);
  
  return {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  };
};
