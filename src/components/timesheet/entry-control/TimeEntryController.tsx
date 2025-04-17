
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
  
  // Memoize the create entry handler to avoid recreating on every render
  const handleCreateNewEntry = useCallback(() => {
    if (!interactive) return;
    
    // Trigger adding a new entry form
    addEntryForm();
  }, [interactive, addEntryForm]);
  
  // Memoize props to prevent unnecessary re-renders
  const managerProps = useMemo(() => ({
    formHandlers,
    interactive,
    onAddEntry: handleCreateNewEntry,
    startTime,
    endTime,
    calculatedHours,
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    handleSaveEntry,
    saveAllPendingChanges,
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
