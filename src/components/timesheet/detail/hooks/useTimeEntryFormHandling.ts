
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryForm } from '@/hooks/timesheet/useTimeEntryForm';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { useToast } from '@/hooks/use-toast';
import { usePrevious } from '@/hooks/usePrevious';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeEntryFormHandling');

interface UseTimeEntryFormHandlingProps {
  date: Date;
  userId?: string;
  entries?: TimeEntry[];
  interactive?: boolean;
}

export const useTimeEntryFormHandling = ({
  date,
  userId,
  entries = [],
  interactive = true
}: UseTimeEntryFormHandlingProps) => {
  const { toast } = useToast();
  const { getWorkHoursForDate } = useTimesheetWorkHours(userId);
  const { startTime, endTime, calculatedHours } = getWorkHoursForDate(date, userId || '');
  
  const [formHandlers, setFormHandlers] = useState<UseTimeEntryFormReturn[]>([]);
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]); // Changed from number[] to boolean[]
  const previousDate = usePrevious(date);
  
  // Initialize form handlers based on entries
  useEffect(() => {
    if (!date || !interactive) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Setting up form handlers for ${entries.length} entries`);
      
      // Reset form visibility array when entries change
      const newVisibility: boolean[] = entries.length > 0 
        ? new Array(entries.length).fill(false)  // Changed from numbers to booleans
        : [];
      
      setShowEntryForms(newVisibility);
      
      // Create form handlers for each entry
      const handlers: UseTimeEntryFormReturn[] = entries.map((entry, index) => {
        return useTimeEntryForm({
          initialData: entry,
          formKey: `entry-${entry.id}-${index}`,
          selectedDate: date,
          userId: userId || entry.userId,
          autoSave: false,
          disabled: !interactive,
          autoCalculateHours: true
        });
      });
      
      setFormHandlers(handlers);
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error setting up form handlers:', error);
    }
  }, [entries, date, interactive, userId]);
  
  // Reset when date changes
  useEffect(() => {
    if (previousDate && date && previousDate.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      setShowEntryForms([]);
    }
  }, [date, previousDate]);
  
  // Add a new entry form
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    try {
      // If there are no existing forms, show the first entry form
      if (entries.length > 0 && showEntryForms.length > 0) {
        logger.debug('[useTimeEntryFormHandling] Adding new entry form from existing entries');
        
        // Find the first hidden form if any
        const firstHiddenIndex = showEntryForms.findIndex(isVisible => !isVisible);
        
        if (firstHiddenIndex >= 0) {
          // Show an existing but hidden form
          setShowEntryForms(prev => {
            const updated = [...prev];
            updated[firstHiddenIndex] = true; // Changed from index to true
            return updated;
          });
          return;
        }
      }
      
      // Create a new form if needed
      logger.debug('[useTimeEntryFormHandling] Creating brand new entry form');
      const newHandler = useTimeEntryForm({
        selectedDate: date,
        userId,
        initialData: {
          startTime,
          endTime
        },
        formKey: `new-entry-${Date.now()}`,
        autoSave: false,
        disabled: !interactive,
        autoCalculateHours: true
      });
      
      // Update the form handlers and visibility
      setFormHandlers(prev => [...prev, newHandler]);
      setShowEntryForms(prev => [...prev, true]); // Changed from index to true
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error adding entry form:', error);
      
      toast({
        title: 'Error',
        description: 'Could not add a new entry form',
        variant: 'destructive'
      });
    }
  }, [interactive, entries.length, showEntryForms, date, userId, startTime, endTime, toast]);
  
  // Remove an entry form
  const removeEntryForm = useCallback((index: number) => {
    if (!interactive || index < 0 || index >= showEntryForms.length) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Removing entry form at index ${index}`);
      
      // Check if the form has unsaved changes
      if (formHandlers[index]?.formState.formEdited) {
        // Save changes before removing
        formHandlers[index].handleSave(); // Using handleSave() instead of handleSubmit()
      }
      
      // Hide the form instead of removing it completely
      setShowEntryForms(prev => {
        const updated = [...prev];
        updated[index] = false; // Changed from number to false
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
      formHandlers[index].handleSave(); // Using handleSave() instead of handleSubmit()
    } catch (error) {
      logger.error(`[useTimeEntryFormHandling] Error saving entry ${index}:`, error);
      
      toast({
        title: 'Error',
        description: 'Could not save entry',
        variant: 'destructive'
      });
    }
  }, [interactive, formHandlers, toast]);
  
  // Save all pending changes
  const saveAllPendingChanges = useCallback(() => {
    if (!interactive) return false;
    
    try {
      logger.debug('[useTimeEntryFormHandling] Saving all pending changes');
      
      let savedCount = 0;
      
      // Find all visible and edited forms
      showEntryForms.forEach((isVisible, index) => {
        if (isVisible && index < formHandlers.length && formHandlers[index].formState.formEdited) {
          formHandlers[index].handleSave(); // Using handleSave() instead of handleSubmit()
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
  
  // Get visible entry forms count
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
