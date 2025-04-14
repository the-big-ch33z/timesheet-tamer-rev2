
import { useState, useCallback, useEffect } from 'react';
import { TimeEntryFormState, UseTimeEntryFormProps } from './types/timeEntryTypes';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage form state and field changes
 */
export const useFormStateManagement = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
  const { toast } = useToast();
  
  // Form state
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [taskNumber, setTaskNumber] = useState("");
  const [formEdited, setFormEdited] = useState(false);
  
  // Time state
  const [startTime, setStartTime] = useState(initialData.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData.endTime || "17:00");

  // Reset form when initialData or formKey changes
  useEffect(() => {
    console.debug("[useFormStateManagement] Resetting form with initialData:", initialData, "formKey:", formKey);
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
    setFormEdited(false);
    console.debug("[useFormStateManagement] Form reset complete");
  }, [initialData, formKey]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.debug(`[useFormStateManagement] Field changed: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring field change");
      return;
    }
    
    // Always mark form as edited when a field changes
    setFormEdited(true);
    
    try {
      switch (field) {
        case 'hours':
          console.debug(`[useFormStateManagement] Setting hours to ${value}`);
          setHours(value);
          break;
        case 'description':
          console.debug(`[useFormStateManagement] Setting description to ${value}`);
          setDescription(value);
          break;
        case 'jobNumber':
          console.debug(`[useFormStateManagement] Setting jobNumber to ${value}`);
          setJobNumber(value);
          break;
        case 'rego':
          console.debug(`[useFormStateManagement] Setting rego to ${value}`);
          setRego(value);
          break;
        case 'taskNumber':
          console.debug(`[useFormStateManagement] Setting taskNumber to ${value}`);
          setTaskNumber(value);
          break;
        case 'startTime':
          console.debug(`[useFormStateManagement] Setting startTime to ${value}`);
          setStartTime(value);
          if (autoCalculateHours) {
            const calculatedHours = calculateHoursFromTimes(value, endTime);
            console.debug(`[useFormStateManagement] Auto-calculated hours: ${calculatedHours}`);
            setHours(calculatedHours.toFixed(1));
          }
          break;
        case 'endTime':
          console.debug(`[useFormStateManagement] Setting endTime to ${value}`);
          setEndTime(value);
          if (autoCalculateHours) {
            const calculatedHours = calculateHoursFromTimes(startTime, value);
            console.debug(`[useFormStateManagement] Auto-calculated hours: ${calculatedHours}`);
            setHours(calculatedHours.toFixed(1));
          }
          break;
        default:
          console.warn(`[useFormStateManagement] Unknown field: ${field}`);
          break;
      }
    } catch (error) {
      console.error("[useFormStateManagement] Error handling field change:", error);
      toast({
        title: "Error updating field",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [disabled, autoCalculateHours, startTime, endTime, toast]);

  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.debug(`[useFormStateManagement] Updating times: ${newStartTime} to ${newEndTime}`);
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    // Mark form as edited when times are updated
    setFormEdited(true);
  }, []);

  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.debug(`[useFormStateManagement] Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    setHours(calculatedHours.toFixed(1));
    // Mark form as edited when hours are calculated
    setFormEdited(true);
    return calculatedHours;
  }, [startTime, endTime]);

  // Reset form fields
  const resetForm = useCallback(() => {
    console.debug("[useFormStateManagement] Resetting form fields to empty values");
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
    setFormEdited(false);
  }, []);

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
    handleFieldChange,
    resetFormEdited: () => {
      console.debug("[useFormStateManagement] Resetting formEdited flag to false");
      setFormEdited(false);
    },
    resetForm,
    updateTimes,
    setHoursFromTimes
  };
};
