
import { useCallback, useMemo, useEffect, useRef } from 'react';
import { TimeEntry } from "@/types";
import { useFormStateManagement } from './useFormStateManagement';
import { useFormSubmission } from './useFormSubmission';
import { useAutoSave } from './useAutoSave';
import { UseTimeEntryFormProps, UseTimeEntryFormReturn } from './types/timeEntryTypes';

/**
 * Main hook for managing time entry form state and submission
 */
export const useTimeEntryForm = ({
  initialData = {},
  formKey,
  onSave,
  selectedDate,
  userId,
  autoSave = false,
  disabled = false,
  autoCalculateHours = false
}: UseTimeEntryFormProps): UseTimeEntryFormReturn => {
  // Use specialized hooks
  const {
    formState,
    handleFieldChange,
    resetFormEdited,
    resetForm,
    updateTimes,
    setHoursFromTimes
  } = useFormStateManagement({ 
    initialData, 
    formKey,
    disabled,
    autoCalculateHours
  });
  
  const {
    handleSave: handleSaveInternal,
    getFormData: getFormDataInternal,
    isSubmitting
  } = useFormSubmission({ 
    initialData, 
    selectedDate, 
    userId, 
    onSave,
    disabled
  });

  // Track last selected date to detect changes
  const lastSelectedDateRef = useRef<Date | null>(null);
  
  useEffect(() => {
    // If the date changes and we have unsaved changes, save them
    if (lastSelectedDateRef.current && 
        selectedDate && 
        lastSelectedDateRef.current.getTime() !== selectedDate.getTime() && 
        formState.formEdited) {
      console.log("Date changed with unsaved form data - auto-saving");
      handleSaveInternal(formState, resetFormEdited);
    }
    
    // Update the ref with current date
    lastSelectedDateRef.current = selectedDate;
  }, [selectedDate, formState, handleSaveInternal, resetFormEdited]);

  // Check if form has content
  const hasContent = useMemo(() => {
    return !!(formState.hours || formState.description || formState.jobNumber || 
              formState.rego || formState.taskNumber);
  }, [formState]);

  // Setup auto-save
  useAutoSave(
    autoSave,
    formState.formEdited,
    hasContent,
    disabled || false,
    isSubmitting,
    () => handleSaveInternal(formState, resetFormEdited)
  );

  // Create a method to check and save any pending changes
  const saveIfEdited = useCallback(() => {
    if (formState.formEdited && hasContent && !disabled && !isSubmitting) {
      console.log("Form has unsaved changes - saving before action");
      handleSaveInternal(formState, resetFormEdited);
      return true;
    }
    return false;
  }, [formState, hasContent, disabled, isSubmitting, handleSaveInternal, resetFormEdited]);

  // Create wrapper functions
  const handleSave = useCallback(() => {
    handleSaveInternal(formState, resetFormEdited);
  }, [formState, handleSaveInternal, resetFormEdited]);

  const getFormData = useCallback(() => {
    return getFormDataInternal(formState);
  }, [formState, getFormDataInternal]);

  return {
    formState,
    handleFieldChange,
    handleSave,
    saveIfEdited, // New method to check and save if needed
    getFormData,
    resetFormEdited,
    resetForm,
    updateTimes,
    setHoursFromTimes,
    isSubmitting
  };
};

// Re-export types for easier access
export type { UseTimeEntryFormProps, UseTimeEntryFormReturn, TimeEntryFormState } from './types/timeEntryTypes';
