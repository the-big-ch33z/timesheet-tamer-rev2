
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
    
    console.debug("[useFormSubmission] Prepared form data:", formData);
    return formData;
  }, [selectedDate, initialData, userId]);

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
    console.debug("[useFormSubmission] handleSave called with formState:", formState);
    console.debug("[useFormSubmission] disabled:", disabled, "isSubmitting:", isSubmitting);
    
    if (disabled) {
      console.debug("[useFormSubmission] Form is disabled, aborting save");
      return;
    }
    
    if (isSubmitting) {
      console.debug("[useFormSubmission] Already submitting, aborting duplicate save");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.debug("[useFormSubmission] Starting submission");
      
      const formData = getFormData(formState);
      console.debug("[useFormSubmission] Form data prepared:", formData);
      
      if (onSave) {
        console.debug("[useFormSubmission] Calling onSave function");
        onSave(formData);
        console.debug("[useFormSubmission] onSave function executed");
      } else {
        console.warn("[useFormSubmission] No onSave function provided");
      }
      
      console.debug("[useFormSubmission] Resetting formEdited flag");
      resetFormEdited();
      
      // Allow the form to be submitted again after a short delay
      setTimeout(() => {
        console.debug("[useFormSubmission] Submission cooldown complete");
        setIsSubmitting(false);
      }, 300);
    } catch (error) {
      console.error("[useFormSubmission] Error saving entry:", error);
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
