import { useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // ✅ NEW
import { TimeEntry } from "@/types";
import { useFormStateManagement } from './useFormStateManagement';
import { useFormSubmission } from './useFormSubmission';
import { useAutoSave } from './useAutoSave';
import { UseTimeEntryFormProps, UseTimeEntryFormReturn, TimeEntryFormState } from './types/timeEntryTypes';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // ✅ Add stable form ID
  const idRef = useRef<string>(uuidv4());

  console.debug("[useTimeEntryForm] Initializing with props:", {
    initialData,
    formKey,
    selectedDate: selectedDate?.toISOString(),
    userId,
    autoSave,
    disabled,
    autoCalculateHours
  });

  useEffect(() => {
    console.debug(`[useTimeEntryForm] Disabled state changed to: ${disabled}`);
  }, [disabled]);

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

  const lastSelectedDateRef = useRef<Date | null>(null);
  const submittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      lastSelectedDateRef.current &&
      selectedDate &&
      lastSelectedDateRef.current.getTime() !== selectedDate.getTime() &&
      formState.formEdited
    ) {
      console.debug("[useTimeEntryForm] Date changed with unsaved form data - auto-saving");
      if (formState.hours) {
        handleSaveInternal(formState, resetFormEdited);
      } else {
        console.debug("[useTimeEntryForm] Date changed but skipping auto-save due to missing required fields");
        resetFormEdited();
      }
    } else if (
      lastSelectedDateRef.current &&
      selectedDate &&
      lastSelectedDateRef.current.getTime() !== selectedDate.getTime()
    ) {
      console.debug("[useTimeEntryForm] Date changed but no unsaved changes to auto-save");
    }

    lastSelectedDateRef.current = selectedDate;
  }, [selectedDate, formState, handleSaveInternal, resetFormEdited]);

  const hasContent = useMemo(() => {
    const hasData = !!(
      formState.hours ||
      formState.description ||
      formState.jobNumber ||
      formState.rego ||
      formState.taskNumber
    );
    console.debug("[useTimeEntryForm] Form has content:", hasData);
    return hasData;
  }, [formState]);

  useAutoSave(
    autoSave,
    formState.formEdited,
    hasContent && !!formState.hours,
    disabled || false,
    isSubmitting || submittingRef.current,
    () => handleSaveInternal(formState, resetFormEdited)
  );

  const saveIfEdited = useCallback(() => {
    console.debug("[useTimeEntryForm] saveIfEdited called - checking for changes", {
      formEdited: formState.formEdited,
      hasContent,
      hasHours: !!formState.hours,
      disabled,
      isSubmitting
    });

    if (formState.formEdited && hasContent && !disabled && !isSubmitting) {
      if (!formState.hours) {
        console.debug("[useTimeEntryForm] Missing required hours field - cannot save");
        toast({
          title: "Hours are required",
          description: "Please enter the number of hours before saving",
          variant: "destructive"
        });
        return false;
      }

      console.debug("[useTimeEntryForm] Form has unsaved changes - saving before action");
      submittingRef.current = true;

      try {
        handleSaveInternal(formState, resetFormEdited);
        return true;
      } finally {
        setTimeout(() => {
          submittingRef.current = false;
        }, 300);
      }
    }

    console.debug("[useTimeEntryForm] No changes to save or unable to save");
    return false;
  }, [formState, hasContent, disabled, isSubmitting, handleSaveInternal, resetFormEdited, toast]);

  const handleSave = useCallback(() => {
    console.debug("[useTimeEntryForm] handleSave called");

    if (!formState.hours) {
      console.debug("[useTimeEntryForm] Missing required hours field - cannot save");
      toast({
        title: "Hours are required",
        description: "Please enter the number of hours before saving",
        variant: "destructive"
      });
      return;
    }

    submittingRef.current = true;
    try {
      handleSaveInternal(formState, resetFormEdited);
    } finally {
      setTimeout(() => {
        submittingRef.current = false;
      }, 300);
    }
  }, [formState, handleSaveInternal, resetFormEdited, toast]);

  const getFormData = useCallback(() => {
    console.debug("[useTimeEntryForm] getFormData called");
    return getFormDataInternal(formState);
  }, [formState, getFormDataInternal]);

  return {
    id: idRef.current, // ✅ RETURN the stable ID
    formState,
    handleFieldChange,
    handleSave,
    saveIfEdited,
    getFormData,
    resetFormEdited,
    resetForm,
    updateTimes,
    setHoursFromTimes,
    isSubmitting: isSubmitting || submittingRef.current
  };
};

// Re-export types for easier access
export type { UseTimeEntryFormProps, UseTimeEntryFormReturn, TimeEntryFormState } from './types/timeEntryTypes';
