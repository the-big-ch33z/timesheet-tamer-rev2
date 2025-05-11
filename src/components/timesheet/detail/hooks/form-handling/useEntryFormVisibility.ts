import { useState, useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useEntryFormVisibility');

/**
 * Hook to manage visibility of time entry forms by ID,
 * using CSS class toggling to avoid unmounting components.
 */
export const useEntryFormVisibility = () => {
  const [formVisibility, setFormVisibilityState] = useState<Record<string, boolean>>({});

  const visibleFormsCount = Object.values(formVisibility).filter(Boolean).length;

  const setFormVisibility = useCallback((formId: string, isVisible: boolean) => {
    logger.debug(`[useEntryFormVisibility] Setting form ${formId} visibility to ${isVisible}`);
    setFormVisibilityState(prev => ({
      ...prev,
      [formId]: isVisible
    }));
  }, []);

  const showForm = useCallback((formId: string) => {
    setFormVisibility(formId, true);
  }, [setFormVisibility]);

  const hideForm = useCallback((formId: string) => {
    setFormVisibility(formId, false);
  }, [setFormVisibility]);

  const resetVisibility = useCallback((initialForms: Record<string, boolean> = {}) => {
    logger.debug(`[useEntryFormVisibility] Resetting visibility to ${Object.keys(initialForms).length} forms`);
    setFormVisibilityState(initialForms);
  }, []);

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
