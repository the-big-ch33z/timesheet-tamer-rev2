
import { useCallback, useState } from 'react';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useToast } from '@/hooks/use-toast';

const logger = createTimeLogger('useFormActions');

interface UseFormActionsProps {
  formHandlers: UseTimeEntryFormReturn[];
  showEntryForms: boolean[];
  interactive: boolean;
}

/**
 * Hook to handle form actions like saving and managing entries
 */
export const useFormActions = ({
  formHandlers,
  showEntryForms,
  interactive
}: UseFormActionsProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Save a specific entry
  const handleSaveEntry = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= formHandlers.length) return;
    
    try {
      logger.debug(`[useFormActions] Saving entry at index ${index}`);
      formHandlers[index].handleSave();
    } catch (error) {
      logger.error(`[useFormActions] Error saving entry ${index}:`, error);
      
      toast({
        title: 'Error',
        description: 'Could not save entry',
        variant: 'destructive'
      });
    }
  }, [interactive, formHandlers, toast]);
  
  // Save all entries
  const saveAllPendingChanges = useCallback(() => {
    if (!interactive) return false;
    
    try {
      setIsSaving(true);
      logger.debug('[useFormActions] Saving all pending changes');
      
      let savedCount = 0;
      
      // Check each visible form
      showEntryForms.forEach((isVisible, index) => {
        if (isVisible && index < formHandlers.length && formHandlers[index].formState.formEdited) {
          formHandlers[index].handleSave();
          savedCount++;
        }
      });
      
      if (savedCount > 0) {
        toast({
          title: 'Entries saved',
          description: `Saved ${savedCount} time ${savedCount === 1 ? 'entry' : 'entries'}`
        });
        return true;
      } else {
        logger.debug('[useFormActions] No changes to save');
        return false;
      }
    } catch (error) {
      logger.error('[useFormActions] Error saving all entries:', error);
      
      toast({
        title: 'Error',
        description: 'Could not save all entries',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      // Reset saving state after a short delay
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [interactive, showEntryForms, formHandlers, toast]);
  
  return {
    handleSaveEntry,
    saveAllPendingChanges,
    isSaving
  };
};
