
import { useState, useCallback, useRef } from 'react';

/**
 * Hook to manage submission state with optimizations
 * to prevent unnecessary re-renders
 */
export const useSubmissionState = (disabled: boolean = false) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use a ref to track submission state for immediate access
  const isSubmittingRef = useRef(false);
  
  const startSubmission = useCallback(() => {
    if (!disabled && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
    }
  }, [disabled]);
  
  const endSubmission = useCallback(() => {
    // Use setTimeout to avoid state updates during rendering cycle
    setTimeout(() => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }, 100);
  }, []);
  
  return {
    isSubmitting,
    isSubmittingRef,
    startSubmission,
    endSubmission
  };
};
