
import { useState, useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useEntryFormVisibility');

/**
 * Hook to manage the visibility of entry forms using CSS classes instead of 
 * conditional rendering to prevent unmounting
 */
export const useEntryFormVisibility = (initialVisibility: boolean[] = []) => {
  const [formVisibility, setFormVisibility] = useState<Record<string, boolean>>({});
  
  // Track visible forms count
  const visibleFormsCount = Object.values(formVisibility).filter(Boolean).length;
  
  // Toggle form visibility
  const setFormVisibility = useCallback((formId: string, isVisible: boolean) => {
    logger.debug(`[useEntryFormVisibility] Setting form ${formId} visibility to ${isVisible}`);
    
    setFormVisibility(prev => ({
      ...prev,
      [formId]: isVisible
    }));
  }, []);
  
  // Show a form
  const showForm = useCallback((formId: string) => {
    setFormVisibility(formId, true);
  }, [setFormVisibility]);
  
  // Hide a form
  const hideForm = useCallback((formId: string) => {
    setFormVisibility(formId, false);
  }, [setFormVisibility]);
  
  // Reset all form visibility
  const resetVisibility = useCallback((initialForms: Record<string, boolean> = {}) => {
    logger.debug(`[useEntryFormVisibility] Resetting visibility to ${Object.keys(initialForms).length} forms`);
    setFormVisibility(initialForms);
  }, []);

  // Generate CSS classes for forms
  const getFormClass = useCallback((formId: string) => {
    return formVisibility[formId] ? 'block' : 'hidden';
  }, [formVisibility]);
  
  return {
    formVisibility,
    setFormVisibility,
    visibleFormsCount,
    showForm,
    hideForm,
    resetVisibility,
    getFormClass
  };
};
