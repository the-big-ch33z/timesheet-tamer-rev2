
import React, { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { DraftProvider } from '@/contexts/timesheet/draft-context/DraftContext';
import EntryInterface from './EntryInterface';
import { useLogger } from '@/hooks/useLogger';

interface TimeEntryControllerProps {
  date: Date;
  userId: string;
  interactive?: boolean;
}

const TimeEntryController: React.FC<TimeEntryControllerProps> = ({
  date,
  userId,
  interactive = true
}) => {
  const { createEntry, dayEntries, deleteEntry } = useTimeEntryContext();
  const logger = useLogger('TimeEntryController');

  const handleCreateEntry = useCallback((entry: Omit<TimeEntry, "id">) => {
    logger.debug("[TimeEntryController] Creating entry:", entry);
    if (createEntry) {
      const newEntryId = createEntry({
        ...entry,
        userId,
        date
      });
      logger.debug("[TimeEntryController] Entry created with ID:", newEntryId);
      return newEntryId;
    }
    return null;
  }, [createEntry, userId, date]);

  const handleDeleteEntry = useCallback((entryId: string) => {
    logger.debug("[TimeEntryController] Deleting entry:", entryId);
    if (deleteEntry) {
      return deleteEntry(entryId);
    }
    return false;
  }, [deleteEntry]);

  return (
    <DraftProvider selectedDate={date} userId={userId}>
      <EntryInterface
        date={date}
        userId={userId}
        onCreateEntry={handleCreateEntry}
        onDeleteEntry={handleDeleteEntry}
        interactive={interactive}
        existingEntries={dayEntries}
      />
    </DraftProvider>
  );
};

export default TimeEntryController;
