
import { useState, useEffect } from 'react';
import { useFormStorage } from './useFormStorage';
import { useFieldBatching } from './useFieldBatching';
import { useTimeCalculation } from './useTimeCalculation';
import { useFormReset } from './useFormReset';
import { TimeEntryFormState } from '../types/timeEntryTypes';
import { useToast } from "@/hooks/use-toast";
import { TimeEntry } from "@/types";

// Define the Timeout type to match NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

/**
 * Core hook to manage form state with improved separation of concerns
 */
export const useFormStateCore = ({ 
  initialData = {} as Partial<TimeEntry>, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: {
  initialData?: Partial<TimeEntry>;
  formKey?: string | number;
  disabled?: boolean;
  autoCalculateHours?: boolean;
}) => {
  const { toast } = useToast();
  
  // Track when disabled flag changes
  useEffect(() => {
    console.debug(`[useFormStateCore] Disabled state changed to: ${disabled}`);
  }, [disabled]);
  
  // Form state
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [taskNumber, setTaskNumber] = useState("");
  const [formEdited, setFormEdited] = useState(false);
  
  // We'll store these in local variables only, they're not part of TimeEntry anymore
  const [startTime, setStartTime] = useState("09:00"); 
  const [endTime, setEndTime] = useState("17:00");
  
  // Use specialized sub-hooks 
  const { 
    loadFormDraft, 
    saveFormDraft, 
    clearFormDraft 
  } = useFormStorage(formKey);
  
  const {
    batchedChangesRef,
    batchTimeoutRef,
    handleFieldChange: handleBatchedFieldChange,
    processBatchedChanges
  } = useFieldBatching({
    setHours,
    setDescription,
    setJobNumber,
    setRego,
    setTaskNumber,
    setStartTime,
    setEndTime,
    setFormEdited,
    disabled,
    startTime,
    endTime,
    autoCalculateHours,
    toast
  });
  
  const {
    updateTimes,
    setHoursFromTimes
  } = useTimeCalculation({
    startTime, 
    endTime, 
    processBatchedChanges,
    batchedChangesRef,
    batchTimeoutRef
  });

  const { resetForm } = useFormReset({
    setHours,
    setDescription,
    setJobNumber,
    setRego,
    setTaskNumber,
    setFormEdited,
    formKey,
    batchTimeoutRef,
    batchedChangesRef
  });

  // Try to load any saved draft for this form
  useEffect(() => {
    if (!formKey) return;
    
    const draft = loadFormDraft();
    if (draft) {
      console.debug(`[useFormStateCore] Found saved draft for form ${formKey}`, draft);
      
      if (draft.hours) setHours(draft.hours);
      if (draft.description) setDescription(draft.description);
      if (draft.jobNumber) setJobNumber(draft.jobNumber);
      if (draft.rego) setRego(draft.rego);
      if (draft.taskNumber) setTaskNumber(draft.taskNumber);
      
      // Only mark as edited if we have substantive content
      if (draft.hours || draft.description || draft.jobNumber || 
          draft.rego || draft.taskNumber) {
        setFormEdited(true);
      }
    }
  }, [formKey, loadFormDraft]);

  // Reset form when initialData or formKey changes
  useEffect(() => {
    console.debug("[useFormStateCore] Resetting form with initialData:", initialData, "formKey:", formKey);
    
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    
    // These are no longer part of TimeEntry
    setStartTime("09:00");
    setEndTime("17:00");
    
    setFormEdited(false);
    console.debug("[useFormStateCore] Form reset complete");
    
    // Clear any saved draft for this form
    if (formKey) {
      clearFormDraft();
    }
    
    // Clear any batched changes
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    batchedChangesRef.current = {};
  }, [initialData, formKey, clearFormDraft]);

  // Save form draft when edited
  useEffect(() => {
    if (!formEdited || disabled || !formKey) return;
    
    const formData = {
      hours,
      description,
      jobNumber,
      rego,
      taskNumber
    };
    
    saveFormDraft(formData);
  }, [hours, description, jobNumber, rego, taskNumber, formEdited, disabled, formKey, saveFormDraft]);

  // Current form state
  const formState: TimeEntryFormState = {
    hours,
    description,
    jobNumber,
    rego,
    taskNumber,
    formEdited,
    userId: initialData.userId || '',
  };

  return {
    formState,
    handleFieldChange: handleBatchedFieldChange,
    resetFormEdited: () => {
      console.debug("[useFormStateCore] Resetting formEdited flag to false");
      setFormEdited(false);
      
      // Clear any saved draft when form is successfully submitted
      if (formKey) {
        clearFormDraft();
      }
    },
    resetForm,
    updateTimes,
    setHoursFromTimes
  };
};
