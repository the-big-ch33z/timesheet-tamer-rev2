
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFormDataPreparation } from './form-submission/useFormDataPreparation';
import { useSubmissionState } from './form-submission/useSubmissionState';
import { useDateTracking } from './form-submission/useDateTracking';
import { useSubmissionError } from './form-submission/useSubmissionError';
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
  const { isSubmitting, startSubmission, endSubmission } = useSubmissionState(disabled);
  const { getFormData } = useFormDataPreparation({ initialData, selectedDate, userId });
  const { isDateValid } = useDateTracking(selectedDate);
  const { handleError } = useSubmissionError();

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
      startSubmission();
      
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
      
      toast({
        title: "Entry saved",
        description: "Your time entry has been saved successfully",
      });
      
      endSubmission();
    } catch (error) {
      handleError(error);
      endSubmission();
    }
  }, [disabled, isSubmitting, getFormData, onSave, toast, startSubmission, endSubmission, handleError]);

  return {
    handleSave,
    getFormData,
    isSubmitting
  };
};
