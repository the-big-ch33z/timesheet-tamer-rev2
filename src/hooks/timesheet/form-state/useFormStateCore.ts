
import { useState, useEffect } from 'react';
import { useFormStorage } from './useFormStorage';
import { useFieldBatching } from './useFieldBatching';
import { useTimeCalculation } from './useTimeCalculation';
import { useFormReset } from './useFormReset';
import { TimeEntryFormState } from '../types/timeEntryTypes';
import { useToast } from "@/hooks/use-toast";

/**
 * Core hook to manage form state with improved separation of concerns
 */
export const useFormStateCore = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
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
  const [startTime, setStartTime] = useState(initialData.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData.endTime || "17:00");
  const [formEdited, setFormEdited] = useState(false);
  
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
      if (draft.startTime) setStartTime(draft.startTime);
      if (draft.endTime) setEndTime(draft.endTime);
      
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
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
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
      taskNumber,
      startTime,
      endTime
    };
    
    saveFormDraft(formData);
  }, [hours, description, jobNumber, rego, taskNumber, startTime, endTime, formEdited, disabled, formKey, saveFormDraft]);

  // Current form state
  const formState: TimeEntryFormState = {
    hours,
    description,
    jobNumber,
    rego,
    taskNumber,
    formEdited,
    userId: initialData.userId,
    startTime,
    endTime
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
