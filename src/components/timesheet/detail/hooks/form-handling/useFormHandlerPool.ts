
import { useState, useRef, useCallback, useMemo } from 'react';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useToast } from '@/hooks/use-toast';

const logger = createTimeLogger('useFormHandlerPool');

interface UseFormHandlerPoolProps {
  fixedHandlers: UseTimeEntryFormReturn[];
  emptyHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
}

/**
 * Hook to manage a pool of form handlers with fixed capacity
 */
export const useFormHandlerPool = ({
  fixedHandlers,
  emptyHandlers,
  interactive
}: UseFormHandlerPoolProps) => {
  const { toast } = useToast();
  
  // Track which handlers are in use
  const usedHandlersRef = useRef<number[]>([]);
  const [formHandlers, setFormHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  const [unusedEmptyHandlers, setUnusedEmptyHandlers] = useState<UseTimeEntryFormReturn[]>(emptyHandlers);
  
  // Add a new handler from the pool of empty handlers
  const addHandler = useCallback(() => {
    if (!interactive) return null;
    
    logger.debug('[useFormHandlerPool] Adding new handler from pool');
    
    try {
      if (unusedEmptyHandlers.length > 0) {
        // Take one handler from the pool
        const emptyHandler = unusedEmptyHandlers[0];
        const remainingHandlers = unusedEmptyHandlers.slice(1);
        
        // Reset the handler to ensure it's clean
        emptyHandler.resetForm();
        
        // Update state
        setFormHandlers(prev => [...prev, emptyHandler]);
        setUnusedEmptyHandlers(remainingHandlers);
        
        logger.debug('[useFormHandlerPool] Added new handler from pool');
        return emptyHandler;
      } else {
        logger.debug('[useFormHandlerPool] Empty handler pool depleted');
        
        toast({
          title: 'Maximum entries reached',
          description: 'Please save or remove existing entries first.',
          variant: 'destructive'
        });
        
        return null;
      }
    } catch (error) {
      logger.error('[useFormHandlerPool] Error adding handler:', error);
      
      toast({
        title: 'Error',
        description: 'Could not add a new entry form',
        variant: 'destructive'
      });
      
      return null;
    }
  }, [interactive, unusedEmptyHandlers, toast]);
  
  // Remove a handler and return it to the pool if it's an empty handler
  const removeHandler = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= formHandlers.length) return;
    
    try {
      const handler = formHandlers[index];
      
      logger.debug(`[useFormHandlerPool] Removing handler at index ${index}`);
      
      // If this is an empty handler, return it to the pool
      const isEmptyHandler = index >= fixedHandlers.length;
      
      if (isEmptyHandler && handler) {
        // Reset the handler
        handler.resetForm();
        
        // Add it back to the pool
        setUnusedEmptyHandlers(prev => [...prev, handler]);
        
        // Remove it from active handlers
        setFormHandlers(prev => {
          const updated = [...prev];
          updated.splice(index, 1);
          return updated;
        });
      }
    } catch (error) {
      logger.error(`[useFormHandlerPool] Error removing handler ${index}:`, error);
    }
  }, [interactive, formHandlers, fixedHandlers.length]);
  
  // Initialize handlers with data - use stringified entries for stable dependency
  const initializeHandlers = useCallback((entries: any[] = []) => {
    if (!interactive) return;
    
    // Reset tracking arrays
    usedHandlersRef.current = [];
    
    // Initialize handlers from our fixed pool
    const activeHandlers: UseTimeEntryFormReturn[] = [];
    
    // Assign existing entries to handlers
    for (let i = 0; i < Math.min(entries.length, fixedHandlers.length); i++) {
      const handler = fixedHandlers[i];
      
      // Update handler with entry data
      handler.resetForm();
      if (entries[i]) {
        const entry = entries[i];
        handler.handleFieldChange('hours', entry.hours?.toString() || '');
        handler.handleFieldChange('description', entry.description || '');
        handler.handleFieldChange('jobNumber', entry.jobNumber || '');
        handler.handleFieldChange('rego', entry.rego || '');
        handler.handleFieldChange('taskNumber', entry.taskNumber || '');
        handler.handleFieldChange('startTime', entry.startTime || '');
        handler.handleFieldChange('endTime', entry.endTime || '');
        handler.resetFormEdited(); // Don't mark as edited initially
      }
      
      usedHandlersRef.current.push(i);
      activeHandlers.push(handler);
    }
    
    // Reset state
    setFormHandlers(activeHandlers);
    setUnusedEmptyHandlers(emptyHandlers);
    
    logger.debug(`[useFormHandlerPool] Initialized ${activeHandlers.length} handlers and ${emptyHandlers.length} empty handlers`);
  }, [fixedHandlers, emptyHandlers, interactive]);
  
  // Use memo to stabilize the return values
  return useMemo(() => ({
    formHandlers,
    unusedEmptyHandlers,
    addHandler,
    removeHandler,
    initializeHandlers
  }), [formHandlers, unusedEmptyHandlers, addHandler, removeHandler, initializeHandlers]);
};
