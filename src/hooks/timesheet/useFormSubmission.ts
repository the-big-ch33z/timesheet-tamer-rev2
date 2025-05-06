
import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFormDataPreparation } from './form-submission/useFormDataPreparation';
import { useSubmissionState } from './form-submission/useSubmissionState';
import { useDateTracking } from './form-submission/useDateTracking';
import { useSubmissionError } from './form-submission/useSubmissionError';
import { UseTimeEntryFormProps, TimeEntryFormState } from './types/timeEntryTypes';

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

  const handleSave = useCallback((formState: TimeEntryFormState, resetFormEdited: () => void) => {
    if (disabled || isSubmitting) {
      return;
    }
    
    try {
      startSubmission();
      
      // Validate hours
      if (!formState.hours || parseFloat(formState.hours) <= 0) {
        throw new Error("Hours must be greater than zero");
      }
      
      // Log the form state to help debug
      console.debug("[useFormSubmission] Form state before submission:", { 
        hours: formState.hours,
        description: formState.description,
        jobNumber: formState.jobNumber
      });
      
      // Prepare form data
      const formData = getFormData(formState);
      
      // Log the prepared data
      console.debug("[useFormSubmission] Prepared form data:", { 
        hours: formData.hours,
        description: formData.description,
        jobNumber: formData.jobNumber
      });
      
      if (onSave) {
        onSave(formData);
      }
      
      resetFormEdited();
      
      toast({
        title: "Entry saved",
        description: `Your time entry of ${formData.hours} hours has been saved successfully`,
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
