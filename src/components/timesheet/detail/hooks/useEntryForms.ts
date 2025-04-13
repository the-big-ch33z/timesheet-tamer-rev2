
import { useState, useCallback } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

interface UseEntryFormsProps {
  formHandlers: UseTimeEntryFormReturn[];
  maxForms?: number;
  onNeedMoreHandlers?: () => void;
}

export const useEntryForms = ({
  formHandlers,
  maxForms = 10,
  onNeedMoreHandlers
}: UseEntryFormsProps) => {
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]);
  const [key, setKey] = useState(Date.now()); // Key to force re-render
  
  // Add a new entry form
  const addEntryForm = useCallback(() => {
    // Limit to maximum number of forms
    if (showEntryForms.length < maxForms) {
      console.log("Adding new entry form");
      setShowEntryForms(prev => [...prev, true]);
      
      // Check if we need more handlers
      const newFormIndex = showEntryForms.length;
      if (!formHandlers[newFormIndex] && onNeedMoreHandlers) {
        console.log("Requesting new form handler at index:", newFormIndex);
        onNeedMoreHandlers();
      }
    }
  }, [showEntryForms.length, formHandlers, maxForms, onNeedMoreHandlers]);
  
  // Remove an entry form at specific index
  const removeEntryForm = useCallback((index: number) => {
    console.log("Removing entry form at index:", index);
    setShowEntryForms(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Force a re-render
  const refreshForms = useCallback(() => {
    console.log("Forcing re-render of entry forms");
    setKey(Date.now());
  }, []);

  return {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    key,
    refreshForms
  };
};
