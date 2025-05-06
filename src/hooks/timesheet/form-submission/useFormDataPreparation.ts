
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
    formEdited: boolean;
  }) => {
    console.debug("[useFormDataPreparation] Preparing form data", formState);
    
    if (!selectedDate) {
      console.warn("[useFormDataPreparation] No selected date provided");
      throw new Error("No date selected");
    }
    
    // Handle hours value more carefully
    const hoursString = formState.hours?.toString().trim();
    console.debug("[useFormDataPreparation] Processing hours from:", hoursString);
    
    // Ensure we have a valid string to parse
    if (!hoursString) {
      console.warn("[useFormDataPreparation] Empty hours value");
      throw new Error("Hours cannot be empty");
    }
    
    // Parse numerical hours from string and ensure it's valid
    // Use parseFloat and handle potential formatting issues
    const hours = parseFloat(hoursString);
    console.debug("[useFormDataPreparation] Parsed hours:", hours, "from string:", hoursString);
    
    if (isNaN(hours)) {
      console.warn("[useFormDataPreparation] Hours value is not a number:", hoursString);
      throw new Error("Hours must be a valid number");
    }
    
    if (hours <= 0) {
      console.warn("[useFormDataPreparation] Hours value is not positive:", hours);
      throw new Error("Hours must be greater than zero");
    }
    
    // Create the processed form data with properly validated hours
    return {
      ...initialData,
      hours,
      description: formState.description,
      jobNumber: formState.jobNumber,
      rego: formState.rego,
      taskNumber: formState.taskNumber,
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
