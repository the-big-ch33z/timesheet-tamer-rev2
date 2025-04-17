
import { useCallback, useMemo } from 'react';
import { ensureDate } from '@/utils/time/validation';

/**
 * Hook for preparing form data before submission
 */
export const useFormDataPreparation = ({ 
  initialData = {}, 
  selectedDate,
  userId
}: {
  initialData?: Record<string, any>;
  selectedDate: Date | null;
  userId: string;
}) => {
  // Memoize the function to prevent unnecessary recreations
  const getFormData = useCallback((formState: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
    startTime: string;
    endTime: string;
    formEdited: boolean;
  }) => {
    console.debug("[useFormDataPreparation] Preparing form data");
    
    if (!selectedDate) {
      console.warn("[useFormDataPreparation] No selected date provided");
      throw new Error("No date selected");
    }
    
    // Parse numerical hours from string
    const hours = parseFloat(formState.hours) || 0;
    
    if (hours <= 0) {
      console.warn("[useFormDataPreparation] Invalid hours value:", hours);
      throw new Error("Hours must be greater than zero");
    }
    
    // Create the processed form data
    return {
      ...initialData,
      hours,
      description: formState.description,
      jobNumber: formState.jobNumber,
      rego: formState.rego,
      taskNumber: formState.taskNumber,
      startTime: formState.startTime,
      endTime: formState.endTime,
      userId,
      date: selectedDate,
      project: initialData.project || 'General'
    };
  }, [initialData, selectedDate, userId]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({ 
    getFormData 
  }), [getFormData]);
};
