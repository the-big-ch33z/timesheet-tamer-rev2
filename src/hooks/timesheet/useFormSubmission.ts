import { useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFormDataPreparation } from './form-submission/useFormDataPreparation';
import { useSubmissionState } from './form-submission/useSubmissionState';
import { useDateTracking } from './form-submission/useDateTracking';
import { useSubmissionError } from './form-submission/useSubmissionError';
import { UseTimeEntryFormProps } from './types/timeEntryTypes';

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
      
      const formData = getFormData(formState);
      
      if (onSave) {
        onSave(formData);
      }
      
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
