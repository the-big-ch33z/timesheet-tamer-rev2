
import { useState, useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { UseTimeEntryFormProps } from './types/timeEntryTypes';

/**
 * Hook to handle form submission and data preparation
 */
export const useFormSubmission = ({
  initialData = {},
  selectedDate,
  userId,
  onSave,
  disabled = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'selectedDate' | 'userId' | 'onSave' | 'disabled'>) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare form data for submission
  const getFormData = useCallback((formState: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
    startTime: string;
    endTime: string;
  }) => ({
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
  }), [selectedDate, initialData, userId]);

  // Handle form submission
  const handleSave = useCallback((formState: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
    startTime: string;
    endTime: string;
    formEdited: boolean;
  }, resetFormEdited: () => void) => {
    if (disabled || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formData = getFormData(formState);
      
      console.log("Saving form with data:", formData);
      
      if (onSave) {
        onSave(formData);
      }
      
      resetFormEdited();
      
      // Allow the form to be submitted again after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 300);
    } catch (error) {
      toast({
        title: "Error saving entry",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  }, [disabled, isSubmitting, getFormData, onSave, toast]);

  return {
    handleSave,
    getFormData,
    isSubmitting
  };
};
