
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryForm } from '@/hooks/timesheet/useTimeEntryForm';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { useToast } from '@/hooks/use-toast';
import { usePrevious } from '@/hooks';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeEntryFormHandling');

// Maximum number of handlers we will pre-initialize
// This ensures we have a fixed number of hook calls
const MAX_HANDLERS = 20;

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
  userId,
  entries = [],
  interactive = true
}: UseTimeEntryFormHandlingProps) => {
  const { toast } = useToast();
  const { getWorkHoursForDate } = useTimesheetWorkHours(userId);
  const { startTime, endTime, calculatedHours } = getWorkHoursForDate(date, userId || '');
  
  // Tracking state with refs to avoid re-renders
  const previousDateRef = useRef<Date | null>(null);
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]);
  
  // Create a fixed array of form handlers regardless of entries length
  // This ensures hooks are always called in the same order
  const handler1 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-1`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler2 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-2`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler3 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-3`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  // Continue for additional handlers (up to MAX_HANDLERS)
  // We'll use an array to store all these handlers
  const handler4 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-4`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler5 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-5`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  // Here we combine all our fixed handlers into an array
  const fixedHandlers = [handler1, handler2, handler3, handler4, handler5];
  
  // Create empty handlers for new entries
  const newHandler1 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-1`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const newHandler2 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-2`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const newHandler3 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-3`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  // Combine empty handlers
  const emptyHandlers = [newHandler1, newHandler2, newHandler3];
  
  // Refs to track which handlers are in use
  const usedHandlersRef = useRef<number[]>([]);
  const emptyHandlersUsedRef = useRef<number[]>([]);
  
  // Track active form handlers
  const [formHandlers, setFormHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  const [unusedEmptyHandlers, setUnusedEmptyHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  
  // Set up initial form handlers and visibility
  useEffect(() => {
    if (!interactive) return;
    
    // Reset tracking arrays
    usedHandlersRef.current = [];
    emptyHandlersUsedRef.current = [];
    
    // Initialize visibility array
    const newVisibility = entries.length > 0 
      ? new Array(entries.length).fill(false)
      : [];
    
    // Initialize handlers from our fixed pool
    const activeHandlers: UseTimeEntryFormReturn[] = [];
    
    // Assign existing entries to handlers
    for (let i = 0; i < Math.min(entries.length, fixedHandlers.length); i++) {
      const handler = fixedHandlers[i];
      // Update handler with entry data
      handler.resetForm();
      if (entries[i]) {
        const entry = entries[i];
        handler.handleFieldChange('hours', entry.hours.toString());
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
    
    // Set unused empty handlers for new entries
    setUnusedEmptyHandlers(emptyHandlers);
    
    // Update state
    setFormHandlers(activeHandlers);
    setShowEntryForms(newVisibility);
    
    logger.debug(`[useTimeEntryFormHandling] Initialized ${activeHandlers.length} handlers and ${emptyHandlers.length} empty handlers`);
  }, [entries, fixedHandlers, emptyHandlers, interactive]);
  
  // Reset when date changes
  useEffect(() => {
    if (previousDateRef.current && date && previousDateRef.current.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      
      // Reset visibility
      setShowEntryForms([]);
      
      // Reset unused handlers
      setUnusedEmptyHandlers(emptyHandlers);
      
      // Reset tracking
      usedHandlersRef.current = [];
      emptyHandlersUsedRef.current = [];
    }
    
    // Update ref
    previousDateRef.current = date;
  }, [date, emptyHandlers]);
  
  // Add entry form using a handler from the pre-initialized pool
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    logger.debug('[useTimeEntryFormHandling] Adding new entry form');
    
    try {
      if (unusedEmptyHandlers.length > 0) {
        // Take one handler from the pool
        const emptyHandler = unusedEmptyHandlers[0];
        const remainingHandlers = unusedEmptyHandlers.slice(1);
        
        // Reset the handler to ensure it's clean
        emptyHandler.resetForm();
        emptyHandler.handleFieldChange('startTime', startTime);
        emptyHandler.handleFieldChange('endTime', endTime);
        
        // Update form handlers and visibility
        setFormHandlers(prev => [...prev, emptyHandler]);
        setShowEntryForms(prev => [...prev, true]);
        setUnusedEmptyHandlers(remainingHandlers);
        
        logger.debug('[useTimeEntryFormHandling] Added new entry form from pool');
      } else {
        logger.debug('[useTimeEntryFormHandling] Empty handler pool depleted');
        
        toast({
          title: 'Maximum entries reached',
          description: 'Please save or remove existing entries first.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error adding entry form:', error);
      
      toast({
        title: 'Error',
        description: 'Could not add a new entry form',
        variant: 'destructive'
      });
    }
  }, [interactive, unusedEmptyHandlers, toast, startTime, endTime]);
  
  // Remove entry form (just hide it)
  const removeEntryForm = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= showEntryForms.length) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Removing entry form at index ${index}`);
      
      if (formHandlers[index]?.formState.formEdited) {
        formHandlers[index].handleSave();
      }
      
      setShowEntryForms(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
      
      // If this was an empty handler, return it to the pool
      if (index >= entries.length) {
        const handler = formHandlers[index];
        if (handler) {
          handler.resetForm();
          setUnusedEmptyHandlers(prev => [...prev, handler]);
          
          // Remove it from formHandlers
          setFormHandlers(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
          });
        }
      }
      
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error removing entry form ${index}:`, error);
    }
  }, [interactive, showEntryForms, formHandlers, entries.length]);
  
  // Save a specific entry
  const handleSaveEntry = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= formHandlers.length) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Saving entry at index ${index}`);
      formHandlers[index].handleSave();
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error saving entry ${index}:`, error);
      
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
      logger.debug('[useTimeEntryFormHandling] Saving all pending changes');
      
      let savedCount = 0;
      
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
        logger.debug('[useTimeEntryFormHandling] No changes to save');
        return false;
      }
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error saving all entries:', error);
      
      toast({
        title: 'Error',
        description: 'Could not save all entries',
        variant: 'destructive'
      });
      
      return false;
    }
  }, [interactive, showEntryForms, formHandlers, toast]);
  
  const visibleFormsCount = showEntryForms.filter(Boolean).length;
  
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
