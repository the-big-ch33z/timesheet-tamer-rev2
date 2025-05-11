
import { useCallback, useState } from 'react';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useToast } from '@/hooks/use-toast';

const logger = createTimeLogger('useFormActions');

interface UseFormActionsProps {
  formHandlers: UseTimeEntryFormReturn[];
  formVisibility: Record<string, boolean>;
  interactive: boolean;
}

/**
 * Hook to manage form actions like saving and validation
 */
export const useFormActions = ({
  formHandlers,
  formVisibility,
  interactive
}: UseFormActionsProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Save a specific entry form
  const handleSaveEntry = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= formHandlers.length) return;
    
    const formId = `entry-form-${index}`;
    const isVisible = formVisibility[formId];
    
    if (!isVisible) {
      logger.debug(`[useFormActions] Form ${formId} is not visible, skipping save`);
      return;
    }
    
    const formHandler = formHandlers[index];
    
    try {
      logger.debug(`[useFormActions] Saving form ${formId}`);
      setIsSaving(true);
      
      // Check if the form is valid before saving
      if (!formHandler.formState.hours) {
        logger.warn(`[useFormActions] Form ${formId} has no hours, cannot save`);
        toast({
          title: "Cannot save entry",
          description: "Please enter hours for the entry",
          variant: "destructive"
        });
        return;
      }
      
      // Save the form
      formHandler.handleSave();
      logger.debug(`[useFormActions] Form ${formId} saved successfully`);
      
    } catch (error) {
      logger.error(`[useFormActions] Error saving form ${formId}:`, error);
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [interactive, formHandlers, formVisibility, toast]);
  
  // Save all forms with pending changes
  const saveAllPendingChanges = useCallback(() => {
    if (!interactive) return false;
    
    logger.debug(`[useFormActions] Saving all pending changes`);
    let savedAny = false;
    
    try {
      // Loop through all visible forms and save those with changes
      Object.entries(formVisibility).forEach(([formId, isVisible]) => {
        if (!isVisible) return;
        
        // Extract the index from the formId
        const match = formId.match(/entry-form-(\d+)/);
        if (!match) return;
        
        const index = parseInt(match[1]);
        if (isNaN(index) || index < 0 || index >= formHandlers.length) return;
        
        const formHandler = formHandlers[index];
        
        // Check if form has changes and hours
        if (formHandler.formState.formEdited && formHandler.formState.hours) {
          logger.debug(`[useFormActions] Saving form ${formId} with pending changes`);
          formHandler.handleSave();
          savedAny = true;
        }
      });
      
      return savedAny;
    } catch (error) {
      logger.error(`[useFormActions] Error saving pending changes:`, error);
      toast({
        title: "Error",
        description: "Failed to save one or more entries",
        variant: "destructive"
      });
      return false;
    }
  }, [interactive, formVisibility, formHandlers, toast]);
  
  return {
    handleSaveEntry,
    saveAllPendingChanges,
    isSaving
  };
};
