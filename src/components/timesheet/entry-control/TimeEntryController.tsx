
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
  const { getWorkHoursForDate } = useTimesheetWorkHours(userId);
  const workHoursData = useMemo(() => getWorkHoursForDate(date, userId), [date, userId, getWorkHoursForDate]);
  const { startTime, endTime, calculatedHours } = workHoursData;
  
  // Use ref for component key to avoid re-renders
  const componentKeyRef = useRef(Date.now());
  
  // Use ref for event subscriptions to avoid memory leaks
  const unsubscribersRef = useRef<Array<() => void>>([]);
  
  const { 
    formHandlers,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
  } = useTimeEntryFormHandling({
    date,
    userId,
    entries: dayEntries,
    interactive,
    initialStartTime: startTime,
    initialEndTime: endTime
  });
  
  // Set up event listeners only once using refs
  useEffect(() => {
    logger.debug('[TimeEntryController] Setting up event listeners');
    
    // Clear any existing subscriptions to avoid duplicates
    if (unsubscribersRef.current.length > 0) {
      logger.debug('[TimeEntryController] Cleaning up previous subscriptions');
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    }
    
    // Store the unsubscribe functions in the ref
    const handleEntryEvent = () => {
      logger.debug('[TimeEntryController] Entry event received');
    };
    
    unsubscribersRef.current = [
      timeEventsService.subscribe('entry-created', handleEntryEvent),
      timeEventsService.subscribe('entry-updated', handleEntryEvent),
      timeEventsService.subscribe('entry-deleted', handleEntryEvent)
    ];
    
    return () => {
      // Cleanup subscriptions
      logger.debug('[TimeEntryController] Cleaning up event subscriptions on unmount');
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Memoize the create entry handler to avoid recreating on every render
  const handleCreateNewEntry = useCallback((entryStartTime: string, entryEndTime: string, hours: number) => {
    if (!interactive) return;
    
    try {
      if (onCreateEntry) {
        logger.debug(`[TimeEntryController] Creating entry via prop callback: ${entryStartTime}-${entryEndTime}`);
        onCreateEntry(entryStartTime, entryEndTime, hours);
      } else if (createEntry) {
        logger.debug(`[TimeEntryController] Creating entry via context: ${entryStartTime}-${entryEndTime}`);
        createEntry({
          date,
          userId,
          startTime: entryStartTime,
          endTime: entryEndTime,
          hours,
          description: '',
          jobNumber: '',
          rego: '',
          taskNumber: '',
          project: 'General'
        });
        
        timeEventsService.publish('entry-created', {
          startTime: entryStartTime,
          endTime: entryEndTime,
          hours,
          userId,
          date: date.toISOString()
        });
      }
    } catch (error) {
      logger.error('[TimeEntryController] Error creating entry:', error);
    }
  }, [date, userId, interactive, onCreateEntry, createEntry]);
  
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
