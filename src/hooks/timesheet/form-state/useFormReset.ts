
import { useCallback } from 'react';

/**
 * Hook for handling form reset operations
 */
export const useFormReset = ({
  setHours,
  setDescription,
  setJobNumber,
  setRego,
  setTaskNumber,
  setFormEdited,
  formKey,
  batchTimeoutRef,
  batchedChangesRef
}) => {
  const resetForm = useCallback(() => {
    console.debug("[useFormReset] Resetting form fields to empty values");
    
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
    setFormEdited(false);
    
    // Clear any batched changes
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    batchedChangesRef.current = {};
    
    // Clear any saved draft for this form
    if (formKey) {
      try {
        const savedDrafts = localStorage.getItem('timesheet-form-drafts');
        if (savedDrafts) {
          const drafts = JSON.parse(savedDrafts);
          if (drafts[formKey]) {
            delete drafts[formKey];
            localStorage.setItem('timesheet-form-drafts', JSON.stringify(drafts));
            console.debug(`[useFormReset] Cleared draft for form ${formKey}`);
          }
        }
      } catch (error) {
        console.error("[useFormReset] Error clearing form draft:", error);
      }
    }
  }, [setHours, setDescription, setJobNumber, setRego, setTaskNumber, setFormEdited, formKey, batchTimeoutRef, batchedChangesRef]);

  return {
    resetForm
  };
};
