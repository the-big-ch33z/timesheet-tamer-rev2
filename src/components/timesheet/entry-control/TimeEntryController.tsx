
import React, { useCallback, useMemo, useRef } from 'react';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
import { useTimeEntryFormHandling } from '../detail/hooks/useTimeEntryFormHandling';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import TimeEntryFormManager from '../detail/managers/TimeEntryFormManager';
import { createTimeLogger } from '@/utils/time/errors';

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
  const { dayEntries } = useTimeEntryContext();
  
  // Get work hours service - stabilize with useRef to prevent dependency churn
  const workHoursService = useTimesheetWorkHours(userId);
  const workHoursServiceRef = useRef(workHoursService);
  // Only update the ref when userId changes
  if (userId !== workHoursServiceRef.current.userId) {
    workHoursServiceRef.current = workHoursService;
  }
  
  // Stabilize the getWorkHoursForDate function using useCallback
  const getWorkHoursForDate = useCallback((dateToUse: Date, userIdToUse: string) => {
    return workHoursServiceRef.current.getWorkHoursForDate(dateToUse, userIdToUse);
  }, []);
  
  // Calculate work hours data with stabilized dependencies
  const workHoursData = useMemo(() => {
    logger.debug(`Calculating work hours for date: ${date.toISOString()}, userId: ${userId}`);
    return getWorkHoursForDate(date, userId);
  }, [date, userId, getWorkHoursForDate]);
  
  // Extract values from workHoursData
  const startTimeRef = useRef(workHoursData.startTime);
  const endTimeRef = useRef(workHoursData.endTime);
  const calculatedHoursRef = useRef(workHoursData.calculatedHours);
  
  // Only update refs when values actually change
  if (workHoursData.startTime !== startTimeRef.current) {
    startTimeRef.current = workHoursData.startTime;
  }
  if (workHoursData.endTime !== endTimeRef.current) {
    endTimeRef.current = workHoursData.endTime;
  }
  if (workHoursData.calculatedHours !== calculatedHoursRef.current) {
    calculatedHoursRef.current = workHoursData.calculatedHours;
  }
  
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
    initialStartTime: startTimeRef.current,
    initialEndTime: endTimeRef.current
  });
  
  // Stabilize the create entry handler
  const handleCreateNewEntry = useCallback(() => {
    if (!interactive) return;
    logger.debug('Creating new entry');
    addEntryForm();
  }, [interactive, addEntryForm]);
  
  if (!interactive) return null;
  
  return (
    <TimeEntryFormManager 
      formHandlers={formHandlers}
      showEntryForms={showEntryForms}
      addEntryForm={addEntryForm}
      removeEntryForm={removeEntryForm}
      handleSaveEntry={handleSaveEntry}
      saveAllPendingChanges={saveAllPendingChanges}
      interactive={interactive}
      startTime={startTimeRef.current}
      endTime={endTimeRef.current}
      calculatedHours={calculatedHoursRef.current}
      onAddEntry={handleCreateNewEntry}
    />
  );
};

export default React.memo(TimeEntryController);
