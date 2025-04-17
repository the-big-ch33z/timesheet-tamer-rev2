
import React, { useCallback, useMemo } from 'react';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
import { useTimeEntryFormHandling } from '../detail/hooks/useTimeEntryFormHandling';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import TimeEntryFormManager from '../detail/managers/TimeEntryFormManager';

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
      startTime={startTime}
      endTime={endTime}
      calculatedHours={calculatedHours}
      onAddEntry={handleCreateNewEntry}
    />
  );
};

export default React.memo(TimeEntryController);
