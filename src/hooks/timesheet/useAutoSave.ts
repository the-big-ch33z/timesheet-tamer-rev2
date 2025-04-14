import { useEffect, useRef } from 'react';

/**
 * Hook to handle auto-saving functionality with debounce
 */
export const useAutoSave = (
  autoSave: boolean,
  formEdited: boolean,
  hasContent: boolean,
  disabled: boolean,
  isSubmitting: boolean,
  handleSave: () => void
) => {
  // Keep track of the timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track whether field is currently being edited to delay auto-save
  const lastEditTimeRef = useRef<number>(0);
  
  // Auto-save effect for inline forms
  useEffect(() => {
    // Only proceed if auto-save is enabled and we have edits with content
    if (autoSave && formEdited && hasContent && !disabled && !isSubmitting) {
      console.debug("[useAutoSave] Form has edits and content, setting up auto-save timer");
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Calculate appropriate delay based on last edit time
      const now = Date.now();
      const timeSinceLastEdit = now - lastEditTimeRef.current;
      const delay = Math.min(Math.max(2000 - timeSinceLastEdit, 800), 2000);
      lastEditTimeRef.current = now;
      
      // Set new timeout with appropriate delay
      timeoutRef.current = setTimeout(() => {
        console.debug("[useAutoSave] Auto-save timer triggered, saving form");
        handleSave();
      }, delay);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      console.debug("[useAutoSave] Auto-save conditions not met, no timer set", {
        autoSave, formEdited, hasContent, disabled, isSubmitting
      });
    }
  }, [autoSave, formEdited, hasContent, disabled, isSubmitting, handleSave]);
  
  // Update last edit time whenever formEdited changes to true
  useEffect(() => {
    if (formEdited) {
      lastEditTimeRef.current = Date.now();
    }
  }, [formEdited]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
