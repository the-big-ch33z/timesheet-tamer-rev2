
import { useState, useEffect, useRef, useMemo } from 'react';
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
  
  // Store these values in refs to prevent re-renders
  const startTimeRef = useRef(initialStartTime);
  const endTimeRef = useRef(initialEndTime);
  const calculatedHoursRef = useRef(8);
  
  // Update refs when props change
  useEffect(() => {
    startTimeRef.current = initialStartTime;
    endTimeRef.current = initialEndTime;
  }, [initialStartTime, initialEndTime]);
  
  // Create form handlers with fixed pattern
  const { fixedHandlers, emptyHandlers } = useEntryFormHandlers({
    date,
    userId,
    interactive,
    startTime: startTimeRef.current,
    endTime: endTimeRef.current
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
  
  // Initialize only when entries change
  const entriesStringified = JSON.stringify(entries.map(e => e.id));
  
  useEffect(() => {
    if (!interactive) return;
    
    logger.debug(`[useTimeEntryFormHandling] Initializing with ${entries.length} entries`);
    
    // Initialize visibility array
    const newVisibility = entries.length > 0 
      ? new Array(entries.length).fill(false) 
      : [];
    
    // Initialize handlers
    initializeHandlers(entries);
    
    // Set visibility state
    resetVisibility(newVisibility);
  }, [entriesStringified, interactive, initializeHandlers, resetVisibility]);
  
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
      newHandler.handleFieldChange('startTime', startTimeRef.current);
      newHandler.handleFieldChange('endTime', endTimeRef.current);
      
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

  // Expose values as an object to avoid re-renders
  const values = useMemo(() => ({
    startTime: startTimeRef.current,
    endTime: endTimeRef.current,
    calculatedHours: calculatedHoursRef.current
  }), []);

  return {
    formHandlers,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    visibleFormsCount,
    ...values
  };
};
