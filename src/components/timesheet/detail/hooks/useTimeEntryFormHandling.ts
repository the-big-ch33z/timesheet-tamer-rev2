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
  
  const timeValues = useMemo(() => ({
    startTime: initialStartTime,
    endTime: initialEndTime,
    calculatedHours: 8
  }), [initialStartTime, initialEndTime]);
  
  const prevEntriesRef = useRef<TimeEntry[]>([]);

  const { fixedHandlers, emptyHandlers } = useEntryFormHandlers({
    date,
    userId,
    interactive,
    startTime: timeValues.startTime,
    endTime: timeValues.endTime
  });

  const previousDateRef = useRef<Date | null>(null);

  const { 
    formVisibility, 
    setFormVisibility,
    visibleFormsCount,
    resetVisibility,
    getFormClass
  } = useEntryFormVisibility();

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

  const {
    handleSaveEntry,
    saveAllPendingChanges,
    isSaving
  } = useFormActions({
    formHandlers,
    formVisibility,
    interactive
  });

  const entriesChanged = useMemo(() => {
    if (entries.length !== prevEntriesRef.current.length) return true;

    const currentIds = new Set(entries.map(e => e.id));
    const prevIds = new Set(prevEntriesRef.current.map(e => e.id));
    
    if (currentIds.size !== prevIds.size) return true;
    for (const id of currentIds) {
      if (!prevIds.has(id)) return true;
    }
    return false;
  }, [entries]);

  // ✅ PATCH 1: Initialize visibility using handler IDs
  useEffect(() => {
    if (!interactive || !entriesChanged) return;

    logger.debug(`[useTimeEntryFormHandling] Initializing with ${entries.length} entries`);

    initializeHandlers(entries);

    const newVisibility: Record<string, boolean> = {};
    fixedHandlers.forEach(handler => {
      newVisibility[handler.id] = true;
    });

    resetVisibility(newVisibility);

    prevEntriesRef.current = [...entries];
  }, [entriesChanged, interactive, initializeHandlers, resetVisibility, entries, fixedHandlers]);

  useEffect(() => {
    if (previousDateRef.current && date &&
        previousDateRef.current.toDateString() !== date.toDateString()) {
      logger.debug('[useTimeEntryFormHandling] Date changed, resetting forms');
      resetVisibility({});
      initializeHandlers([]);
      prevEntriesRef.current = [];
    }
    previousDateRef.current = date;
  }, [date, resetVisibility, initializeHandlers]);

  // ✅ PATCH 2: addEntryForm using handler.id
  const addEntryForm = useCallback(() => {
    if (!interactive) return;

    logger.debug('[useTimeEntryFormHandling] Adding new entry form');

    const newHandler = addHandler();

    if (newHandler) {
      const formId = newHandler.id;

      newHandler.handleFieldChange('startTime', timeValues.startTime);
      newHandler.handleFieldChange('endTime', timeValues.endTime);

      setFormVisibility(formId, true);
    }
  }, [interactive, addHandler, setFormVisibility, timeValues]);

  // ✅ PATCH 3: removeEntryForm using handler.id
  const removeEntryForm = useCallback((index: number) => {
    if (!interactive) return;

    try {
      const handler = formHandlers[index];
      if (!handler) return;

      const formId = handler.id;
      logger.debug(`[useTimeEntryFormHandling] Hiding form ${formId}`);

      if (handler.formState.formEdited) {
        handler.handleSave();
      }

      setFormVisibility(formId, false);

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
