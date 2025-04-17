
import React, { useCallback, useMemo } from 'react';
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
  
  // Get work hours service using the hook
  const workHoursService = useTimesheetWorkHours(userId);
  
  // Stabilize the getWorkHoursForDate function using useCallback
  const getWorkHoursForDate = useCallback((dateToUse: Date, userIdToUse: string) => {
    return workHoursService.getWorkHoursForDate(dateToUse, userIdToUse);
  }, [workHoursService]);
  
  // Calculate work hours data with stabilized dependencies
  const workHoursData = useMemo(() => {
    logger.debug(`Calculating work hours for date: ${date.toISOString()}, userId: ${userId}`);
    return getWorkHoursForDate(date, userId);
  }, [date, userId, getWorkHoursForDate]);
  
  // Use useMemo to create stable props instead of useRef
  const stableWorkHours = useMemo(() => ({
    startTime: workHoursData.startTime,
    endTime: workHoursData.endTime,
    calculatedHours: workHoursData.calculatedHours,
  }), [
    workHoursData.startTime,
    workHoursData.endTime,
    workHoursData.calculatedHours
  ]);
  
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
    initialStartTime: stableWorkHours.startTime,
    initialEndTime: stableWorkHours.endTime
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
      startTime={stableWorkHours.startTime}
      endTime={stableWorkHours.endTime}
      calculatedHours={stableWorkHours.calculatedHours}
      onAddEntry={handleCreateNewEntry}
    />
  );
};

export default React.memo(TimeEntryController);
