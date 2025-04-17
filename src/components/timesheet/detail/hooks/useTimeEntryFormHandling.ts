
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
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
    
    // Initialize visibility array
    const newVisibility = entries.length > 0 
      ? new Array(entries.length).fill(false) 
      : [];
    
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
      
      // Reset visibility
      resetVisibility([]);
      
      // Re-initialize with empty entries
      initializeHandlers([]);
      
      // Clear previous entries
      prevEntriesRef.current = [];
    }
    
    // Update ref
    previousDateRef.current = date;
  }, [date, resetVisibility, initializeHandlers]);
  
  // Add entry form using a handler from the pre-initialized pool - stabilize with useCallback
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    logger.debug('[useTimeEntryFormHandling] Adding new entry form');
    
    // Add a new handler from the pool
    const newHandler = addHandler();
    
    // If we got a handler, update the form time values
    if (newHandler) {
      // Use the memoized time values
      newHandler.handleFieldChange('startTime', timeValues.startTime);
      newHandler.handleFieldChange('endTime', timeValues.endTime);
      
      // Add a visible form
      setShowEntryForms(prev => [...prev, true]);
    }
  }, [interactive, addHandler, setShowEntryForms, timeValues]);
  
  // Remove entry form (just hide it) - stabilize with useCallback
  const removeEntryForm = useCallback((index: number) => {
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
  }, [interactive, showEntryForms.length, formHandlers, setShowEntryForms, entries.length, removeHandler]);

  return {
    formHandlers,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    visibleFormsCount,
    ...timeValues // Spread the memoized values
  };
};
