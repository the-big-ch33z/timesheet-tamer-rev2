
import { useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseFormSubmissionOptions {
  onSubmit: (data: any) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useFormSubmission = ({ onSubmit, onSuccess, onError }: UseFormSubmissionOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const mounted = useRef(true);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      mounted.current = false;
      console.debug('[useFormSubmission] Cleaning up submission state');
    };
  }, []);

  const handleSubmit = useCallback(async (formData: any) => {
    if (isSubmitting || !mounted.current) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      if (mounted.current) {
        toast({
          title: "Success",
          description: "Form submitted successfully",
        });
        
        onSuccess?.();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (mounted.current) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit form",
          variant: "destructive"
        });
        
        onError?.(error instanceof Error ? error : new Error('Submission failed'));
      }
    } finally {
      if (mounted.current) {
        setIsSubmitting(false);
      }
    }
  }, [isSubmitting, onSubmit, onSuccess, onError, toast]);

  return {
    isSubmitting,
    handleSubmit
  };
};
