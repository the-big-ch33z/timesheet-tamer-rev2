
import { useEffect, useRef } from 'react';

/**
 * Hook to automatically save form data after changes
 */
export const useAutoSave = (
  autoSave: boolean,
  formEdited: boolean,
  isValid: boolean,
  disabled: boolean,
  isSubmitting: boolean,
  handleSave: () => void,
  delay: number = 3000
) => {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // If auto-save is not enabled, conditions aren't met, or we're currently submitting, do nothing
    if (!autoSave || !formEdited || !isValid || disabled || isSubmitting) return;
    
    console.debug("[useAutoSave] Setting up auto-save timer");
    
    // Set up new timer
    autoSaveTimerRef.current = setTimeout(() => {
      console.debug("[useAutoSave] Auto-saving form data");
      handleSave();
    }, delay);
    
    // Clean up timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        console.debug("[useAutoSave] Clearing auto-save timer on cleanup");
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, formEdited, isValid, disabled, isSubmitting, handleSave, delay]);
};
