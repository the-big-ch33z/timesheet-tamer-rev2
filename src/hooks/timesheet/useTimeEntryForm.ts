
import { useCallback, useMemo } from 'react';
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
