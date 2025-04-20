
import React from 'react';
import { TimeEntry } from '@/types';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryForm from '../entry-dialog/form/TimeEntryForm';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  interactive?: boolean;
  existingEntries: TimeEntry[];
  isSubmitting: boolean;
}

const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries,
  isSubmitting
}) => {
  const logger = useLogger('EntryInterface');

  const handleSubmitEntry = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Forwarding entry submission", {
      date: entry.date,
      hours: entry.hours,
      hasDescription: !!entry.description
    });
    // Pure pass-through to parent handler
    onCreateEntry(entry);
  };

  const handleCancelForm = () => {
    logger.debug("[EntryInterface] Form cancelled");
  };

  return (
    <div className="space-y-4">
      {interactive && (
        <TimeEntryForm 
          onSubmit={handleSubmitEntry}
          onCancel={handleCancelForm}
          date={date}
          userId={userId}
          initialData={{}}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default EntryInterface;
