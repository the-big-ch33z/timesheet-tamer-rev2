
import { useState } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

interface UseEntryFormsProps {
  formHandlers: UseTimeEntryFormReturn[];
  maxForms?: number;
}

export const useEntryForms = ({
  formHandlers,
  maxForms = 10
}: UseEntryFormsProps) => {
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]);
  const [key, setKey] = useState(Date.now()); // Key to force re-render
  
  // Add a new entry form
  const addEntryForm = () => {
    // Limit to maximum number of forms
    if (showEntryForms.length < maxForms) {
      console.log("Adding new entry form");
      setShowEntryForms(prev => [...prev, true]);
      
      // Initialize the new form with current start/end times
      const newFormIndex = showEntryForms.length;
      if (formHandlers[newFormIndex]) {
        console.log("Initializing new form at index:", newFormIndex);
      }
    }
  };
  
  // Remove an entry form at specific index
  const removeEntryForm = (index: number) => {
    console.log("Removing entry form at index:", index);
    setShowEntryForms(prev => prev.filter((_, i) => i !== index));
  };
  
  // Force a re-render
  const refreshForms = () => {
    console.log("Forcing re-render of entry forms");
    setKey(Date.now());
  };

  return {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    key,
    refreshForms
  };
};
