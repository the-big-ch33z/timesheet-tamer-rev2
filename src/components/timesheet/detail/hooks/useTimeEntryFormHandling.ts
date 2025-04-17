
import { useState, useEffect, useRef } from 'react';
import { TimeEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { usePrevious } from '@/hooks';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
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
}

/**
 * Custom hook for handling multiple time entry forms with a fixed hook pattern
 */
export const useTimeEntryFormHandling = ({
  date,
  userId = '',
  entries = [],
  interactive = true
}: UseTimeEntryFormHandlingProps) => {
  const { toast } = useToast();
  const { getWorkHoursForDate } = useTimesheetWorkHours(userId);
  const { startTime, endTime, calculatedHours } = getWorkHoursForDate(date, userId);
  
  // Tracking state with refs to avoid re-renders
  const previousDateRef = useRef<Date | null>(null);
  
  // Create form handlers with fixed pattern
  const { fixedHandlers, emptyHandlers } = useEntryFormHandlers({
    date,
    userId,
    interactive,
    startTime,
    endTime
  });
  
  // Use the visibility management hook
  const { 
    showEntryForms, 
    setShowEntryForms,
    visibleFormsCount,
    resetVisibility
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
  
  // Use the form actions hook
  const {
    handleSaveEntry,
    saveAllPendingChanges,
    isSaving
  } = useFormActions({
    formHandlers,
    showEntryForms,
    interactive
  });
  
  // Set up initial form handlers and visibility
  useEffect(() => {
    if (!interactive) return;
    
    // Initialize visibility array
    const newVisibility = entries.length > 0 
      ? new Array(entries.length).fill(false) 
      : [];
    
    // Initialize handlers
    initializeHandlers(entries);
    
    // Set visibility state
    resetVisibility(newVisibility);
    
    logger.debug(`[useTimeEntryFormHandling] Initialized with ${entries.length} entries`);
  }, [entries, interactive, initializeHandlers, resetVisibility]);
  
  // Reset when date changes
  useEffect(() => {
    if (previousDateRef.current && date && 
        previousDateRef.current.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      
      // Reset visibility
      resetVisibility([]);
      
      // Re-initialize with empty entries
      initializeHandlers([]);
    }
    
    // Update ref
    previousDateRef.current = date;
  }, [date, resetVisibility, initializeHandlers]);
  
  // Add entry form using a handler from the pre-initialized pool
  const addEntryForm = () => {
    if (!interactive) return;
    
    logger.debug('[useTimeEntryFormHandling] Adding new entry form');
    
    // Add a new handler from the pool
    const newHandler = addHandler();
    
    // If we got a handler, update the form time values
    if (newHandler) {
      newHandler.handleFieldChange('startTime', startTime);
      newHandler.handleFieldChange('endTime', endTime);
      
      // Add a visible form
      setShowEntryForms(prev => [...prev, true]);
    }
  };
  
  // Remove entry form (just hide it)
  const removeEntryForm = (index: number) => {
    if (!interactive || index < 0 || index >= showEntryForms.length) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Removing entry form at index ${index}`);
      
      // Save if edited
      if (formHandlers[index]?.formState.formEdited) {
        formHandlers[index].handleSave();
      }
      
      // Hide the form
      setShowEntryForms(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
      
      // Return handler to pool if it was a new handler
      if (index >= entries.length) {
        removeHandler(index);
      }
      
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error removing entry form ${index}:`, error);
    }
  };

  return {
    formHandlers,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    visibleFormsCount,
    startTime,
    endTime,
    calculatedHours
  };
};
