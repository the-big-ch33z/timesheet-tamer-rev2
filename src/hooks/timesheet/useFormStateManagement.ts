
import { useState, useCallback, useEffect } from 'react';
import { TimeEntryFormState, UseTimeEntryFormProps } from './types/timeEntryTypes';
import { calculateHoursFromTimes } from "@/components/timesheet/utils/timeCalculations";

/**
 * Hook to manage form state and field changes
 */
export const useFormStateManagement = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
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
    console.log("Resetting form with initialData:", initialData);
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
    setFormEdited(false);
  }, [initialData, formKey]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.log(`Field changed in useFormStateManagement: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) return;
    
    if (!formEdited) {
      setFormEdited(true);
    }

    switch (field) {
      case 'hours':
        setHours(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'jobNumber':
        setJobNumber(value);
        break;
      case 'rego':
        setRego(value);
        break;
      case 'taskNumber':
        setTaskNumber(value);
        break;
      case 'startTime':
        setStartTime(value);
        if (autoCalculateHours) {
          const calculatedHours = calculateHoursFromTimes(value, endTime);
          setHours(calculatedHours.toFixed(1));
        }
        break;
      case 'endTime':
        setEndTime(value);
        if (autoCalculateHours) {
          const calculatedHours = calculateHoursFromTimes(startTime, value);
          setHours(calculatedHours.toFixed(1));
        }
        break;
      default:
        break;
    }
  }, [formEdited, disabled, autoCalculateHours, startTime, endTime]);

  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.log(`Updating times in form state management: ${newStartTime} to ${newEndTime}`);
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  }, []);

  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.log(`Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    setHours(calculatedHours.toFixed(1));
    return calculatedHours;
  }, [startTime, endTime]);

  // Reset form fields
  const resetForm = useCallback(() => {
    console.log("Resetting form fields");
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
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
    resetFormEdited: () => setFormEdited(false),
    resetForm,
    updateTimes,
    setHoursFromTimes
  };
};
