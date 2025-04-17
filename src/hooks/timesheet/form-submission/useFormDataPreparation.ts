
import { TimeEntry } from "@/types";
import { useCallback } from 'react';

interface UseFormDataPreparationProps {
  initialData: Partial<TimeEntry>;
  selectedDate: Date | null;
  userId: string | null | undefined;
}

/**
 * Hook for preparing form data for submission
 */
export const useFormDataPreparation = ({
  initialData,
  selectedDate,
  userId
}: UseFormDataPreparationProps) => {
  // Prepare form data for submission
  const getFormData = useCallback((formState: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
    startTime: string;
    endTime: string;
  }) => {
    const formData = {
      date: selectedDate,
      hours: parseFloat(formState.hours) || 0,
      description: formState.description,
      jobNumber: formState.jobNumber,
      rego: formState.rego,
      taskNumber: formState.taskNumber,
      project: initialData.project || "General",
      userId: initialData.userId || userId || "",
      startTime: formState.startTime,
      endTime: formState.endTime,
    };
    
    console.debug("[useFormDataPreparation] Prepared form data:", formData);
    return formData;
  }, [selectedDate, initialData, userId]);

  return {
    getFormData
  };
};
