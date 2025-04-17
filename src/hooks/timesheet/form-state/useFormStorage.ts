
import { useCallback } from 'react';

// Local storage key for saved form drafts
const FORM_DRAFT_STORAGE_KEY = 'timesheet-form-drafts';
// Debounce delay for form draft saving (ms)
const DRAFT_SAVE_DELAY = 1000;

/**
 * Hook to manage form draft storage and retrieval
 */
export const useFormStorage = (formId?: string | number) => {
  // Load a form draft from storage
  const loadFormDraft = useCallback(() => {
    if (!formId) return null;
    
    try {
      const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      if (!savedDrafts) return null;
      
      const drafts = JSON.parse(savedDrafts);
      return drafts[formId.toString()];
    } catch (error) {
      console.error("[useFormStorage] Error loading form draft:", error);
      return null;
    }
  }, [formId]);
  
  // Save a form draft to storage with debouncing
  const saveFormDraft = useCallback((formData: Record<string, string>) => {
    if (!formId) return;
    
    try {
      console.debug(`[useFormStorage] Saving draft for form ${formId}`, formData);
      
      // Get existing drafts
      const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      const drafts = savedDrafts ? JSON.parse(savedDrafts) : {};
      
      // Update draft for this form
      drafts[formId.toString()] = formData;
      
      // Save updated drafts
      localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error("[useFormStorage] Error saving form draft:", error);
    }
  }, [formId]);
  
  // Clear a form draft from storage
  const clearFormDraft = useCallback(() => {
    if (!formId) return;
    
    try {
      const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        if (drafts[formId.toString()]) {
          delete drafts[formId.toString()];
          localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
          console.debug(`[useFormStorage] Cleared draft for form ${formId}`);
        }
      }
    } catch (error) {
      console.error("[useFormStorage] Error clearing form draft:", error);
    }
  }, [formId]);
  
  return {
    loadFormDraft,
    saveFormDraft,
    clearFormDraft
  };
};
