import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryForm } from '@/hooks/timesheet/useTimeEntryForm';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import { useToast } from '@/hooks/use-toast';
import { usePrevious } from '@/hooks';
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
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]); 
  const [emptyHandlerPool, setEmptyHandlerPool] = useState<UseTimeEntryFormReturn[]>([]);
  const handlersInitialized = useRef(false);
  
  const previousDate = usePrevious(date);
  
  useEffect(() => {
    if (!date || !interactive) return;
    
    try {
      logger.debug(`[useTimeEntryFormHandling] Setting up form handlers for ${entries.length} entries`);
      
      const newVisibility: boolean[] = entries.length > 0 
        ? new Array(entries.length).fill(false)
        : [];
      
      setShowEntryForms(newVisibility);
      
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
      handlersInitialized.current = true;
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error setting up form handlers:', error);
    }
  }, [entries, date, interactive, userId]);
  
  useEffect(() => {
    if (!date || !interactive || !handlersInitialized.current) return;
    
    try {
      logger.debug('[useTimeEntryFormHandling] Initializing empty form handler pool');
      
      const neededEmptyHandlers = 3 - emptyHandlerPool.length;
      
      if (neededEmptyHandlers > 0) {
        const newEmptyHandlers: UseTimeEntryFormReturn[] = [];
        
        for (let i = 0; i < neededEmptyHandlers; i++) {
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
          newEmptyHandlers.push(emptyHandler);
        }
        
        setEmptyHandlerPool(prev => [...prev, ...newEmptyHandlers]);
        logger.debug(`[useTimeEntryFormHandling] Added ${neededEmptyHandlers} empty handlers to pool`);
      }
    } catch (error) {
      logger.error('[useTimeEntryFormHandling] Error creating empty form handlers:', error);
    }
  }, [date, interactive, emptyHandlerPool.length, startTime, endTime, userId]);
  
  useEffect(() => {
    if (previousDate && date && previousDate.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      setShowEntryForms([]);
      setEmptyHandlerPool([]);
    }
  }, [date, previousDate]);
  
  const addEntryForm = useCallback(() => {
    if (!interactive) return;
    
    try {
      logger.debug('[useTimeEntryFormHandling] Adding new entry form');
      
      if (emptyHandlerPool.length > 0) {
        const [newHandler, ...remainingHandlers] = emptyHandlerPool;
        
        setFormHandlers(prev => [...prev, newHandler]);
        setShowEntryForms(prev => [...prev, true]);
        setEmptyHandlerPool(remainingHandlers);
        
        logger.debug('[useTimeEntryFormHandling] Added new entry form from pool');
      } else {
        logger.debug('[useTimeEntryFormHandling] Empty handler pool depleted, waiting for replenishment');
        
        setEmptyHandlerPool([]);
        
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
  }, [interactive, emptyHandlerPool, toast]);
  
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
