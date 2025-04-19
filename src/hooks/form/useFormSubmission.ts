
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseFormSubmissionOptions {
  onSubmit: (data: any) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useFormSubmission = ({ onSubmit, onSuccess, onError }: UseFormSubmissionOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async (formData: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive"
      });
      
      onError?.(error instanceof Error ? error : new Error('Submission failed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, onSuccess, onError, toast]);

  return {
    isSubmitting,
    handleSubmit
  };
};
