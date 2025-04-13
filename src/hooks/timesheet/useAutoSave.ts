
import { useEffect } from 'react';

/**
 * Hook to handle auto-saving functionality
 */
export const useAutoSave = (
  autoSave: boolean,
  formEdited: boolean,
  hasContent: boolean,
  disabled: boolean,
  isSubmitting: boolean,
  handleSave: () => void
) => {
  // Auto-save effect for inline forms
  useEffect(() => {
    if (autoSave && formEdited && hasContent && !disabled && !isSubmitting) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 800);
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoSave, formEdited, hasContent, disabled, isSubmitting, handleSave]);
};
