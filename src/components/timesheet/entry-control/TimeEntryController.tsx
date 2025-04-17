
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
import { useTimeEntryFormHandling } from '../detail/hooks/useTimeEntryFormHandling';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { createTimeLogger } from '@/utils/time/errors';
import TimeEntryFormManager from '../detail/managers/TimeEntryFormManager';

const logger = createTimeLogger('TimeEntryController');

interface TimeEntryControllerProps {
  date: Date;
  userId: string;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryController: React.FC<TimeEntryControllerProps> = ({
  date,
  userId,
  interactive = true,
  onCreateEntry
}) => {
  const { dayEntries, createEntry } = useTimeEntryContext();
  const { getWorkHoursForDate, refreshWorkHours } = useTimesheetWorkHours(userId);
  
  // Use ref for component key to avoid re-renders
  const componentKeyRef = useRef(Date.now());
  // Use ref to track event subscriptions
  const unsubscribersRef = useRef<Array<() => void>>([]);
  
  const { 
    formHandlers,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    startTime,
    endTime,
    calculatedHours
  } = useTimeEntryFormHandling({
    date,
    userId,
    entries: dayEntries,
    interactive
  });
  
  // Set up event listeners only once using refs
  useEffect(() => {
    logger.debug('[TimeEntryController] Setting up event listeners');
    
    const handleHoursUpdated = () => {
      logger.debug('[TimeEntryController] Hours updated event received');
      refreshWorkHours();
      // No state updates that cause re-renders
    };
    
    const handleEntryEvent = () => {
      logger.debug('[TimeEntryController] Entry event received');
      // No state updates that cause re-renders
    };
    
    // Clear any existing subscriptions to avoid duplicates
    if (unsubscribersRef.current.length > 0) {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    }
    
    // Store the unsubscribe functions in the ref
    unsubscribersRef.current = [
      timeEventsService.subscribe('hours-updated', handleHoursUpdated),
      timeEventsService.subscribe('entry-created', handleEntryEvent),
      timeEventsService.subscribe('entry-updated', handleEntryEvent),
      timeEventsService.subscribe('entry-deleted', handleEntryEvent)
    ];
    
    return () => {
      // Cleanup subscriptions
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [refreshWorkHours]); // Only depend on refreshWorkHours
  
  // Memoize the create entry handler to avoid recreating on every render
  const handleCreateNewEntry = useCallback((startTime: string, endTime: string, hours: number) => {
    if (!interactive) return;
    
    try {
      if (onCreateEntry) {
        logger.debug(`[TimeEntryController] Creating entry via prop callback: ${startTime}-${endTime}`);
        onCreateEntry(startTime, endTime, hours);
      } else if (createEntry) {
        logger.debug(`[TimeEntryController] Creating entry via context: ${startTime}-${endTime}`);
        createEntry({
          date,
          userId,
          startTime,
          endTime,
          hours,
          description: '',
          jobNumber: '',
          rego: '',
          taskNumber: '',
          project: 'General'
        });
        
        timeEventsService.publish('entry-created', {
          startTime,
          endTime,
          hours,
          userId,
          date: date.toISOString()
        });
      }
      
      // Use setTimeout to avoid state updates during rendering
      setTimeout(() => {
        refreshWorkHours();
      }, 100);
    } catch (error) {
      logger.error('[TimeEntryController] Error creating entry:', error);
    }
  }, [date, userId, interactive, onCreateEntry, createEntry, refreshWorkHours]);
  
  // Memoize props to prevent unnecessary re-renders
  const managerProps = useMemo(() => ({
    formHandlers,
    interactive,
    onCreateEntry: handleCreateNewEntry,
    startTime,
    endTime,
    calculatedHours,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
    key: componentKeyRef.current
  }), [
    formHandlers,
    interactive,
    handleCreateNewEntry,
    startTime,
    endTime,
    calculatedHours,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges
  ]);
  
  if (!interactive) return null;
  
  return (
    <TimeEntryFormManager {...managerProps} />
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(TimeEntryController);
