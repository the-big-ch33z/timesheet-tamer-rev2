
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing submission state
 */
export const useSubmissionState = (disabled: boolean = false) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track when disabled flag changes
  useEffect(() => {
    console.debug(`[useSubmissionState] Disabled state changed to: ${disabled}`);
  }, [disabled]);

  const startSubmission = useCallback(() => {
    setIsSubmitting(true);
    console.debug("[useSubmissionState] Starting submission");
  }, []);

  const endSubmission = useCallback(() => {
    // Allow the form to be submitted again after a short delay
    setTimeout(() => {
      console.debug("[useSubmissionState] Submission cooldown complete");
      setIsSubmitting(false);
    }, 300);
  }, []);

  return {
    isSubmitting,
    startSubmission,
    endSubmission
  };
};
