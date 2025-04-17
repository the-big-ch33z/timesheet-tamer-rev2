
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling form submission errors
 */
export const useSubmissionError = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown) => {
    console.error("[useSubmissionError] Form submission error:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unknown error occurred";
    
    toast({
      title: "Error submitting form",
      description: errorMessage,
      variant: "destructive"
    });
  }, [toast]);

  return { handleError };
};
