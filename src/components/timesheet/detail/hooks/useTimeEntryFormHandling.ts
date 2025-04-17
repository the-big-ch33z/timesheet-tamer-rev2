
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryForm } from '@/hooks/timesheet/useTimeEntryForm';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { useToast } from '@/hooks/use-toast';
import { usePrevious } from '@/hooks';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeEntryFormHandling');

// Maximum number of empty handlers to pre-initialize
const MAX_EMPTY_HANDLERS = 3;

interface UseTimeEntryFormHandlingProps {
  date: Date;
  userId?: string;
  entries?: TimeEntry[];
  interactive?: boolean;
}

/**
 * Custom hook for handling multiple time entry forms
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
  
  // Tracking state
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]);
  const previousDate = usePrevious(date);
  const handlersInitialized = useRef(false);
  
  // Pre-create form handlers for all existing entries
  // This ensures hooks are called at the top level
  const entryFormHandlers = useMemo(() => {
    if (!interactive) return [];
    
    logger.debug(`[useTimeEntryFormHandling] Creating form handlers for ${entries.length} entries`);
    
    try {
      const handlers: UseTimeEntryFormReturn[] = [];
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        // Create handler at the top level
        const handler = useTimeEntryForm({
          initialData: entry,
          formKey: `entry-${entry.id}-${i}`,
          selectedDate: date,
          userId: userId || entry.userId,
          autoSave: false,
          disabled: !interactive,
          autoCalculateHours: true
        });
        handlers.push(handler);
      }
      
      logger.debug(`[useTimeEntryFormHandling] Created ${handlers.length} form handlers for existing entries`);
      return handlers;
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error creating entry form handlers:', error);
      return [];
    }
  }, [entries, date, interactive, userId]);
  
  // Pre-create empty form handlers
  // This ensures hooks are called at the top level
  const emptyFormHandlers = useMemo(() => {
    if (!interactive) return [];
    
    logger.debug('[useTimeEntryFormHandling] Creating empty form handlers pool');
    
    try {
      const handlers: UseTimeEntryFormReturn[] = [];
      
      for (let i = 0; i < MAX_EMPTY_HANDLERS; i++) {
        // Create handler at the top level
        const emptyHandler = useTimeEntryForm({
          selectedDate: date,
          userId,
          initialData: {
            startTime,
            endTime
          },
          formKey: `new-entry-${Date.now()}-${i}`,
          autoSave: false,
          disabled: !interactive,
          autoCalculateHours: true
        });
        handlers.push(emptyHandler);
      }
      
      logger.debug(`[useTimeEntryFormHandling] Created ${handlers.length} empty form handlers`);
      return handlers;
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error creating empty form handlers:', error);
      return [];
    }
  }, [date, interactive, startTime, endTime, userId]);
  
  // Manage used and available form handlers
  const [formHandlers, setFormHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  const [unusedEmptyHandlers, setUnusedEmptyHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  
  // Set up visibility and form handlers when entries or date changes
  useEffect(() => {
    if (!interactive) return;
    
    // Initialize visibility array
    const newVisibility: boolean[] = entries.length > 0 
      ? new Array(entries.length).fill(false)
      : [];
    
    // Update form handlers from pre-created handlers
    setFormHandlers(entryFormHandlers);
    setShowEntryForms(newVisibility);
    setUnusedEmptyHandlers(emptyFormHandlers);
    handlersInitialized.current = true;
    
    logger.debug(`[useTimeEntryFormHandling] Initialized ${entryFormHandlers.length} handlers and ${emptyFormHandlers.length} empty handlers`);
  }, [entries, entryFormHandlers, emptyFormHandlers, interactive]);
  
  // Reset when date changes
  useEffect(() => {
    if (previousDate && date && previousDate.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      setShowEntryForms([]);
      setUnusedEmptyHandlers(emptyFormHandlers);
    }
  }, [date, previousDate, emptyFormHandlers]);
  
  // Add entry form using a handler from the pre-initialized pool
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    logger.debug('[useTimeEntryFormHandling] Adding new entry form');
    
    try {
      if (unusedEmptyHandlers.length > 0) {
        // Take one handler from the pool
        const emptyHandler = unusedEmptyHandlers[0];
        const remainingHandlers = unusedEmptyHandlers.slice(1);
        
        // Update form handlers and visibility
        setFormHandlers(prev => [...prev, emptyHandler]);
        setShowEntryForms(prev => [...prev, true]);
        setUnusedEmptyHandlers(remainingHandlers);
        
        logger.debug('[useTimeEntryFormHandling] Added new entry form from pool');
      } else {
        logger.debug('[useTimeEntryFormHandling] Empty handler pool depleted');
        
        toast({
          title: 'Processing',
          description: 'Creating new entry form...',
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
  }, [interactive, unusedEmptyHandlers, toast]);
  
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
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error removing entry form ${index}:`, error);
    }
  }, [interactive, showEntryForms, formHandlers]);
  
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

