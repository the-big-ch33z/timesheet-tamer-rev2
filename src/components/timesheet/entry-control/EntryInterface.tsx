
import React, { useState } from 'react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';
import EntryWizard from '../entry-wizard/EntryWizard';
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

  // Integrate with the TimeEntryFormManager flow
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

  // Handle creating a new entry from the manager
  const handleCreateFormEntry = (startTime: string, endTime: string, hours: number) => {
    logger.debug("[EntryInterface] Creating entry:", { startTime, endTime, hours });
    
    onCreateEntry({
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
          interactive={interactive}
          onCreateEntry={handleCreateFormEntry}
          startTime={startTime}
          endTime={endTime}
          calculatedHours={calculatedHours}
          showEntryForms={showEntryForms}
          addEntryForm={addEntryForm}
          removeEntryForm={removeEntryForm}
          handleSaveEntry={handleSaveEntry}
          saveAllPendingChanges={saveAllPendingChanges}
          key={Date.now()}
        />
      )}
    </div>
  );
};

export default EntryInterface;
