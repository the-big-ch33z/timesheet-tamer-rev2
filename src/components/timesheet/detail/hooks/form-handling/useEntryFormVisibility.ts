
import { useState, useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useEntryFormVisibility');

/**
 * Hook to manage the visibility of entry forms
 */
export const useEntryFormVisibility = (initialVisibility: boolean[] = []) => {
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>(initialVisibility);
  
  // Track visible forms count
  const visibleFormsCount = showEntryForms.filter(Boolean).length;
  
  // Toggle form visibility
  const setFormVisibility = useCallback((index: number, isVisible: boolean) => {
    logger.debug(`[useEntryFormVisibility] Setting form ${index} visibility to ${isVisible}`);
    
    setShowEntryForms(prev => {
      const updated = [...prev];
      updated[index] = isVisible;
      return updated;
    });
  }, []);
  
  // Show a form
  const showForm = useCallback((index: number) => {
    setFormVisibility(index, true);
  }, [setFormVisibility]);
  
  // Hide a form
  const hideForm = useCallback((index: number) => {
    setFormVisibility(index, false);
  }, [setFormVisibility]);
  
  // Reset all form visibility
  const resetVisibility = useCallback((newVisibility: boolean[] = []) => {
    logger.debug(`[useEntryFormVisibility] Resetting visibility to array of length ${newVisibility.length}`);
    setShowEntryForms(newVisibility);
  }, []);
  
  return {
    showEntryForms,
    setShowEntryForms,
    visibleFormsCount,
    showForm,
    hideForm,
    resetVisibility
  };
};
