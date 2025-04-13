
import { useState, useCallback } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

interface UseEntryFormsProps {
  formHandlers: UseTimeEntryFormReturn[];
  maxForms?: number;
}

export const useEntryForms = ({
  formHandlers,
  maxForms = 5
}: UseEntryFormsProps) => {
  // Track which forms are visible by their indices (initially empty array)
  const [showEntryForms, setShowEntryForms] = useState<number[]>([]);
  const [key, setKey] = useState(Date.now()); // Key to force re-render
  
  // Add a new entry form
  const addEntryForm = useCallback(() => {
    // Limit to maximum number of forms
    if (showEntryForms.length < maxForms) {
      const newIndex = showEntryForms.length;
      console.log("Adding new entry form at index:", newIndex);
      setShowEntryForms(prev => [...prev, newIndex]);
    } else {
      console.log("Maximum number of forms reached:", maxForms);
    }
  }, [showEntryForms.length, maxForms]);
  
  // Remove an entry form at specific index
  const removeEntryForm = useCallback((index: number) => {
    console.log("Removing entry form at index:", index);
    setShowEntryForms(prev => prev.filter(i => i !== index));
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
