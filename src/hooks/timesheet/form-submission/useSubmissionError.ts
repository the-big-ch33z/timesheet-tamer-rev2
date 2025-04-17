
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for handling form submission errors
 */
export const useSubmissionError = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown) => {
    console.error("[useSubmissionError] Error saving entry:", error);
    toast({
      title: "Error saving entry",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
  }, [toast]);

  return {
    handleError
  };
};
