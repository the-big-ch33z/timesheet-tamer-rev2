
import React from 'react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryFormManager from '../detail/managers/TimeEntryFormManager';
import { useTimeEntryFormHandling } from '../detail/hooks/useTimeEntryFormHandling';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  onDeleteEntry: (entryId: string) => boolean;
  interactive?: boolean;
  existingEntries: TimeEntry[];
}

const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries
}) => {
  const logger = useLogger('EntryInterface');

  // Integrate with the TimeEntryFormHandling hook
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
    entries: existingEntries,
    interactive
  });

  // Handle creating a new entry from the form
  const handleAddNewEntry = () => {
    logger.debug("[EntryInterface] Adding new entry form");
    addEntryForm();
  };

  return (
    <div className="space-y-4">
      <ExistingEntriesList
        entries={existingEntries}
        date={date}
        interactive={interactive}
        onDeleteEntry={onDeleteEntry}
      />

      {interactive && (
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
          onAddEntry={handleAddNewEntry}
        />
      )}
    </div>
  );
};

export default EntryInterface;
