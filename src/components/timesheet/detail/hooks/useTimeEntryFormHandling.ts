import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { 
  useEntryFormVisibility,
  useFormHandlerPool,
  useEntryFormHandlers,
  useFormActions
} from './form-handling';

const logger = createTimeLogger('useTimeEntryFormHandling');

interface UseTimeEntryFormHandlingProps {
  date: Date;
  userId?: string;
  entries?: TimeEntry[];
  interactive?: boolean;
  initialStartTime?: string;
  initialEndTime?: string;
}

/**
 * Custom hook for handling multiple time entry forms with a fixed hook pattern
 */
export const useTimeEntryFormHandling = ({
  date,
  userId = '',
  entries = [],
  interactive = true,
  initialStartTime = '09:00',
  initialEndTime = '17:00'
}: UseTimeEntryFormHandlingProps) => {
  const { toast } = useToast();
  
  // Use useMemo for stable time values instead of refs
  const timeValues = useMemo(() => ({
    startTime: initialStartTime,
    endTime: initialEndTime,
    calculatedHours: 8 // Default value
  }), [initialStartTime, initialEndTime]);
  
  const prevEntriesRef = useRef<TimeEntry[]>([]);
  
  // Create form handlers with fixed pattern - pass memoized values
  const { fixedHandlers, emptyHandlers } = useEntryFormHandlers({
    date,
    userId,
    interactive,
    startTime: timeValues.startTime,
    endTime: timeValues.endTime
  });
  
  // Tracking state with refs to avoid re-renders
  const previousDateRef = useRef<Date | null>(null);
  
  // Use the improved visibility management hook
  const { 
    formVisibility, 
    setFormVisibility,
    visibleFormsCount,
    resetVisibility,
    getFormClass
  } = useEntryFormVisibility();
  
  // Use the form handler pool
  const {
    formHandlers,
    addHandler,
    removeHandler,
    initializeHandlers
  } = useFormHandlerPool({
    fixedHandlers,
    emptyHandlers,
    interactive
  });
  
  // Use the form actions hook with updated interface
  const {
    handleSaveEntry,
    saveAllPendingChanges,
    isSaving
  } = useFormActions({
    formHandlers,
    formVisibility,
    interactive
  });
  
  // Memoize the entries comparison to prevent unnecessary re-renders
  const entriesChanged = useMemo(() => {
    if (entries.length !== prevEntriesRef.current.length) {
      return true;
    }
    
    // Compare entry IDs to determine if the entries array has changed substantively
    const currentIds = new Set(entries.map(e => e.id));
    const prevIds = new Set(prevEntriesRef.current.map(e => e.id));
    
    if (currentIds.size !== prevIds.size) {
      return true;
    }
    
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        return true;
      }
    }
    
    return false;
  }, [entries]);
  
  // Initialize only when entries change substantively
  useEffect(() => {
    if (!interactive || !entriesChanged) return;
    
    logger.debug(`[useTimeEntryFormHandling] Initializing with ${entries.length} entries`);
    
    // Initialize visibility with form IDs
    const newVisibility: Record<string, boolean> = {};
    entries.forEach((_, index) => {
      newVisibility[`entry-form-${index}`] = true;
    });
    
    // Initialize handlers
    initializeHandlers(entries);
    
    // Set visibility state
    resetVisibility(newVisibility);
    
    // Update the previous entries reference
    prevEntriesRef.current = [...entries];
  }, [entriesChanged, interactive, initializeHandlers, resetVisibility, entries]);
  
  // Reset when date changes
  useEffect(() => {
    if (previousDateRef.current && date && 
        previousDateRef.current.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      
      // Reset visibility to empty object
      resetVisibility({});
      
      // Re-initialize with empty entries
      initializeHandlers([]);
      
      // Clear previous entries
      prevEntriesRef.current = [];
    }
    
    // Update ref
    previousDateRef.current = date;
  }, [date, resetVisibility, initializeHandlers]);
  
  // Add entry form with stable ID - using stable callback
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    logger.debug('[useTimeEntryFormHandling] Adding new entry form');
    
    // Add a new handler from the pool
    const newHandler = addHandler();
    
    if (newHandler) {
      // Generate a stable form ID
      const formId = `entry-form-${formHandlers.length}`;
      
      // Set up the new handler with time values
      newHandler.handleFieldChange('startTime', timeValues.startTime);
      newHandler.handleFieldChange('endTime', timeValues.endTime);
      
      // Make the form visible
      setFormVisibility(formId, true);
    }
  }, [interactive, addHandler, formHandlers.length, setFormVisibility, timeValues]);
  
  // Remove entry form but keep it mounted - stabilized with useCallback
  const removeEntryForm = useCallback((index: number) => {
    if (!interactive) return;
    
    try {
      const formId = `entry-form-${index}`;
      logger.debug(`[useTimeEntryFormHandling] Hiding form ${formId}`);
      
      // Save if edited before hiding
      if (formHandlers[index]?.formState.formEdited) {
        formHandlers[index].handleSave();
      }
      
      // Just hide the form, don't unmount it
      setFormVisibility(formId, false);
      
      // Return handler to pool if it was a new handler
      if (index >= entries.length) {
        removeHandler(index);
      }
      
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error removing entry form ${index}:`, error);
    }
  }, [interactive, formHandlers, setFormVisibility, entries.length, removeHandler]);

  return {
    formHandlers,
    formVisibility,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    visibleFormsCount,
    getFormClass,
    ...timeValues
  };
};
