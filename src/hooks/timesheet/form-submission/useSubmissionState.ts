
import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Hook to manage submission state with optimizations
 * to prevent unnecessary re-renders
 */
export const useSubmissionState = (disabled = false) => {
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
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isSubmitting,
    isSubmittingRef,
    startSubmission,
    endSubmission
  }), [isSubmitting, startSubmission, endSubmission]);
};
