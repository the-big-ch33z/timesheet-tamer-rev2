
import React, { useState, useEffect, useCallback } from 'react';
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
  
  const [componentKey, setComponentKey] = useState(Date.now());
  
  // Get work hours from the context
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
  
  // Refresh when work hours or entries change
  useEffect(() => {
    const handleHoursUpdated = () => {
      logger.debug('[TimeEntryController] Hours updated event received, refreshing');
      refreshWorkHours();
      setComponentKey(Date.now()); // Force re-render
    };
    
    const handleEntryEvent = () => {
      logger.debug('[TimeEntryController] Entry event received, refreshing');
      setComponentKey(Date.now()); // Force re-render
    };
    
    // Subscribe to events
    const unsubHours = timeEventsService.subscribe('hours-updated', handleHoursUpdated);
    const unsubCreate = timeEventsService.subscribe('entry-created', handleEntryEvent);
    const unsubUpdate = timeEventsService.subscribe('entry-updated', handleEntryEvent);
    const unsubDelete = timeEventsService.subscribe('entry-deleted', handleEntryEvent);
    
    return () => {
      unsubHours();
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, [refreshWorkHours]);
  
  // Handle creating a new entry
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
        
        // Publish event after creating entry
        timeEventsService.publish('entry-created', {
          startTime,
          endTime,
          hours,
          userId,
          date: date.toISOString()
        });
      }
      
      // Force refresh after creation
      setTimeout(() => {
        refreshWorkHours();
        setComponentKey(Date.now());
      }, 100);
    } catch (error) {
      logger.error('[TimeEntryController] Error creating entry:', error);
    }
  }, [date, userId, interactive, onCreateEntry, createEntry, refreshWorkHours]);
  
  if (!interactive) return null;
  
  // Build TimeEntryFormManager props
  const managerProps = {
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
    key: componentKey
  };
  
  return (
    <TimeEntryFormManager {...managerProps} />
  );
};

export default TimeEntryController;
