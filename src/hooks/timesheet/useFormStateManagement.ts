
import { useState, useCallback, useEffect } from 'react';
import { UseTimeEntryFormProps } from './types/timeEntryTypes';
import { calculateHoursFromTimes } from '@/utils/time/calculations';

/**
 * Hook to manage form state for time entries
 */
export const useFormStateManagement = ({
  initialData = {},
  formKey = "default",
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
  // Initial form state
  const [formState, setFormState] = useState({
    hours: initialData.hours?.toString() || '',
    description: initialData.description || '',
    jobNumber: initialData.jobNumber || '',
    rego: initialData.rego || '',
    taskNumber: initialData.taskNumber || '',
    startTime: initialData.startTime || '',
    endTime: initialData.endTime || '',
    project: initialData.project || 'General',
    formEdited: false
  });
  
  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string | number) => {
    console.debug(`[useFormStateManagement] Field change: ${field}=${value}`);
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring change");
      return;
    }
    
    setFormState(prev => ({
      ...prev,
      [field]: value,
      formEdited: true
    }));
  }, [disabled]);
  
  // Reset the formEdited flag
  const resetFormEdited = useCallback(() => {
    console.debug("[useFormStateManagement] Resetting formEdited flag");
    setFormState(prev => ({
      ...prev,
      formEdited: false
    }));
  }, []);
  
  // Reset the entire form
  const resetForm = useCallback(() => {
    console.debug("[useFormStateManagement] Resetting form");
    setFormState({
      hours: '',
      description: '',
      jobNumber: '',
      rego: '',
      taskNumber: '',
      startTime: '',
      endTime: '',
      project: 'General',
      formEdited: false
    });
  }, []);
  
  // Update both start and end times
  const updateTimes = useCallback((startTime: string, endTime: string) => {
    console.debug("[useFormStateManagement] Updating times:", { startTime, endTime });
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring time update");
      return;
    }
    
    setFormState(prev => ({
      ...prev,
      startTime,
      endTime,
      formEdited: true
    }));
    
    // If auto calculate is enabled, update hours as well
    if (autoCalculateHours && startTime && endTime) {
      try {
        const calculatedHours = calculateHoursFromTimes(startTime, endTime);
        console.debug("[useFormStateManagement] Auto-calculated hours:", calculatedHours);
        
        setFormState(prev => ({
          ...prev,
          hours: calculatedHours.toString(),
          formEdited: true
        }));
      } catch (error) {
        console.error("[useFormStateManagement] Error auto-calculating hours:", error);
      }
    }
  }, [disabled, autoCalculateHours]);
  
  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    console.debug("[useFormStateManagement] Calculating hours from times");
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring hours calculation");
      return;
    }
    
    if (formState.startTime && formState.endTime) {
      try {
        const calculatedHours = calculateHoursFromTimes(formState.startTime, formState.endTime);
        console.debug("[useFormStateManagement] Calculated hours:", calculatedHours);
        
        setFormState(prev => ({
          ...prev,
          hours: calculatedHours.toString(),
          formEdited: true
        }));
      } catch (error) {
        console.error("[useFormStateManagement] Error calculating hours:", error);
      }
    }
  }, [formState.startTime, formState.endTime, disabled]);
  
  // If initialData changes, update the form state
  useEffect(() => {
    console.debug("[useFormStateManagement] Initial data changed:", initialData);
    
    setFormState(prev => ({
      hours: initialData.hours?.toString() || prev.hours,
      description: initialData.description || prev.description,
      jobNumber: initialData.jobNumber || prev.jobNumber,
      rego: initialData.rego || prev.rego,
      taskNumber: initialData.taskNumber || prev.taskNumber,
      startTime: initialData.startTime || prev.startTime,
      endTime: initialData.endTime || prev.endTime,
      project: initialData.project || prev.project,
      formEdited: false
    }));
  }, [initialData]);
  
  return {
    formState,
    handleFieldChange,
    resetFormEdited,
    resetForm,
    updateTimes,
    setHoursFromTimes
  };
};
